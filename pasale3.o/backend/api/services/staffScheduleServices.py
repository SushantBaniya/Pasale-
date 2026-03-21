import logging
from collections import defaultdict
from datetime import datetime, timedelta

from django.db import transaction

from api.models import Employee, EmployeeSchedule, EmployeeSkill, Shift

logger = logging.getLogger(__name__)


class SchedulerError(Exception):
    pass


class GreedyStaffScheduler:
    """
    Greedy staff scheduling algorithm with optimized DB access.

    Strategy:
      1. Pre-load all employees, their skills, and existing weekly hours in
         bulk — no per-employee queries inside the main loop.
      2. Sort shifts by duration descending (longest/hardest to fill first).
      3. For each shift, filter to available employees using in-memory data only.
      4. Assign the employee with the fewest scheduled hours (load balancing),
         then immediately update the in-memory hours so subsequent shifts see
         accurate data within the same run.
      5. Persist everything with bulk_create / bulk_update — one round-trip each.
    """

    def __init__(self, business_id, shifts, max_hours_per_week=40):
        """
        Args:
            business_id:         Business ID to schedule for.
            shifts:              QuerySet or list of Shift objects.
            max_hours_per_week:  Weekly hour cap per employee (default 40).
        """
        if not shifts:
            raise SchedulerError("No shifts provided to schedule.")

        self.business_id = business_id
        self.shifts = list(shifts)
        self.max_hours_per_week = max_hours_per_week

        # employee_id → [Shift, ...]
        self.schedule: dict[int, list] = defaultdict(list)
        # employee_id → float (hours accumulated this run + pre-existing hours)
        self.staff_hours: dict[int, float] = defaultdict(float)
        self.unscheduled_shifts: list = []

        self._scheduled = False  # guard: prevent apply without scheduling

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _shift_duration(shift) -> float:
        """Return shift length in hours."""
        start = datetime.combine(shift.shift_date, shift.start_time)
        end = datetime.combine(shift.shift_date, shift.end_time)
        return (end - start).total_seconds() / 3600

    @staticmethod
    def _week_bounds(date):
        """Return (monday, sunday) for the week containing date."""
        monday = date - timedelta(days=date.weekday())
        return monday, monday + timedelta(days=6)

    # ------------------------------------------------------------------
    # Bulk pre-loading
    # ------------------------------------------------------------------

    def _load_employees(self):
        """
        Load all active employees for this business in a single query,
        with their skills prefetched.
        """
        return list(
            Employee.objects
            .filter(business_id=self.business_id)
            .exclude(status__name="Inactive")
            .select_related("status", "department")
            .prefetch_related("skills__skill")
        )

    def _load_week_hours(self, employees, shifts):
        """
        For every (employee, week) combination touched by the given shifts,
        compute existing scheduled hours in a single aggregated query.

        Returns dict: employee_id → float hours already scheduled this week.
        """
        from django.db.models import Sum, F, ExpressionWrapper, DurationField

        if not employees or not shifts:
            return {}

        # Collect all unique weeks spanned by the shifts
        week_ranges = set(self._week_bounds(s.shift_date) for s in shifts)
        employee_ids = [e.id for e in employees]

        # Build a broad date range covering all weeks
        global_start = min(w[0] for w in week_ranges)
        global_end = max(w[1] for w in week_ranges)

        schedules = EmployeeSchedule.objects.filter(
            employee_id__in=employee_ids,
            date__gte=global_start,
            date__lte=global_end,
        ).values("employee_id", "date", "start_time", "end_time")

        hours_map: dict[int, float] = defaultdict(float)
        for row in schedules:
            start = datetime.combine(row["date"], row["start_time"])
            end = datetime.combine(row["date"], row["end_time"])
            hours_map[row["employee_id"]] += (end - start).total_seconds() / 3600

        return hours_map

    def _load_existing_shift_overlaps(self, employees, shifts):
        """
        Pre-load all existing EmployeeSchedule rows that could conflict with
        any of the shifts being scheduled.

        Returns dict: employee_id → [(date, start_time, end_time), ...]
        """
        if not employees or not shifts:
            return {}

        employee_ids = [e.id for e in employees]
        dates = list({s.shift_date for s in shifts})

        rows = EmployeeSchedule.objects.filter(
            employee_id__in=employee_ids,
            date__in=dates,
        ).values("employee_id", "date", "start_time", "end_time")

        overlap_map: dict[int, list] = defaultdict(list)
        for row in rows:
            overlap_map[row["employee_id"]].append(
                (row["date"], row["start_time"], row["end_time"])
            )
        return overlap_map

    def _build_skill_set(self, employees):
        """
        Build in-memory skill lookup.

        Returns dict: employee_id → set of skill_ids
        """
        skill_map: dict[int, set] = defaultdict(set)
        for emp in employees:
            for es in emp.skills.all():
                skill_map[emp.id].add(es.skill_id)
        return skill_map

    # ------------------------------------------------------------------
    # Availability checks (pure in-memory, no DB calls)
    # ------------------------------------------------------------------

    def _has_overlap(self, employee_id, shift, overlap_map, pending_schedules):
        """Check for time conflicts using pre-loaded data + pending assignments."""
        existing = overlap_map.get(employee_id, [])
        pending = pending_schedules.get(employee_id, [])

        for date, start, end in existing + pending:
            if date != shift.shift_date:
                continue
            if start < shift.end_time and end > shift.start_time:
                return True
        return False

    def _has_skill(self, employee_id, shift, skill_map):
        """Check skill requirement using pre-loaded skill set."""
        if not shift.required_skill_id:
            return True
        return shift.required_skill_id in skill_map.get(employee_id, set())

    def _under_hour_cap(self, employee_id, shift, hours_map):
        """Check weekly hour cap using current (live-updated) hours_map."""
        current = hours_map.get(employee_id, 0.0)
        return current + self._shift_duration(shift) <= self.max_hours_per_week

    def _is_available(self, employee, shift, skill_map, hours_map,
                      overlap_map, pending_schedules):
        return (
            self._has_skill(employee.id, shift, skill_map)
            and self._under_hour_cap(employee.id, shift, hours_map)
            and not self._has_overlap(employee.id, shift, overlap_map, pending_schedules)
        )

    # ------------------------------------------------------------------
    # Core scheduling
    # ------------------------------------------------------------------

    def schedule_shifts_greedy(self):
        """
        Execute the greedy scheduling algorithm.

        Returns:
            tuple: (schedule dict, list of unscheduled shifts)
        """
        employees = self._load_employees()
        if not employees:
            logger.warning("No active employees found for business %s.", self.business_id)
            self.unscheduled_shifts = self.shifts[:]
            self._scheduled = True
            return self.schedule, self.unscheduled_shifts

        hours_map = self._load_week_hours(employees, self.shifts)
        overlap_map = self._load_existing_shift_overlaps(employees, self.shifts)
        skill_map = self._build_skill_set(employees)

        # Tracks shifts assigned in this run (not yet in DB) for overlap checks
        pending_schedules: dict[int, list] = defaultdict(list)

        sorted_shifts = sorted(self.shifts, key=self._shift_duration, reverse=True)

        for shift in sorted_shifts:
            available = [
                emp for emp in employees
                if self._is_available(
                    emp, shift, skill_map, hours_map, overlap_map, pending_schedules
                )
            ]

            if not available:
                self.unscheduled_shifts.append(shift)
                logger.warning(
                    "No available employee for shift %s on %s (%s–%s). "
                    "Required skill: %s.",
                    shift.id, shift.shift_date, shift.start_time, shift.end_time,
                    getattr(shift.required_skill, "name", "None"),
                )
                continue

            # Load-balance: pick employee with fewest hours this week
            selected = min(available, key=lambda e: hours_map.get(e.id, 0.0))
            duration = self._shift_duration(shift)

            self.schedule[selected.id].append(shift)
            hours_map[selected.id] = hours_map.get(selected.id, 0.0) + duration
            self.staff_hours[selected.id] += duration

            # Register this assignment for in-run overlap detection
            pending_schedules[selected.id].append(
                (shift.shift_date, shift.start_time, shift.end_time)
            )

            logger.debug(
                "Assigned shift %s → employee %s (%s). "
                "Running hours this week: %.1f",
                shift.id, selected.id, selected.name,
                hours_map[selected.id],
            )

        self._scheduled = True
        return self.schedule, self.unscheduled_shifts

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    @transaction.atomic
    def apply_schedule(self):
        """
        Persist the computed schedule to the database.

        Uses bulk_create and bulk_update for efficiency — two DB round-trips
        regardless of how many shifts are being scheduled.

        Returns:
            dict: Summary with counts and success rate.

        Raises:
            SchedulerError: If called before schedule_shifts_greedy().
        """
        if not self._scheduled:
            raise SchedulerError(
                "Call schedule_shifts_greedy() before apply_schedule()."
            )

        schedules_to_create = []
        shifts_to_update = []

        for employee_id, shifts_list in self.schedule.items():
            for shift in shifts_list:
                schedules_to_create.append(
                    EmployeeSchedule(
                        employee_id=employee_id,
                        date=shift.shift_date,
                        start_time=shift.start_time,
                        end_time=shift.end_time,
                    )
                )
                shift.assigned_employee_id = employee_id
                shift.is_scheduled = True
                shifts_to_update.append(shift)

        EmployeeSchedule.objects.bulk_create(schedules_to_create)
        Shift.objects.bulk_update(shifts_to_update, ["assigned_employee_id", "is_scheduled"])

        scheduled_count = len(shifts_to_update)
        total = len(self.shifts)

        logger.info(
            "Schedule applied: %d/%d shifts assigned (%.1f%%).",
            scheduled_count, total,
            (scheduled_count / total * 100) if total else 0,
        )

        return {
            "scheduled_count": scheduled_count,
            "unscheduled_count": len(self.unscheduled_shifts),
            "total_shifts": total,
            "success_rate": f"{(scheduled_count / total * 100):.2f}%" if total else "0%",
        }

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def get_schedule_summary(self):
        """
        Return a structured summary of the computed schedule.
        Loads employee names in a single query — no N+1.
        """
        if not self._scheduled:
            raise SchedulerError(
                "Call schedule_shifts_greedy() before get_schedule_summary()."
            )

        employee_ids = list(self.schedule.keys())
        employees_by_id = {
            e.id: e
            for e in Employee.objects.filter(id__in=employee_ids)
        }

        schedule_summary = {}
        for employee_id, shifts_list in self.schedule.items():
            employee = employees_by_id[employee_id]
            schedule_summary[employee.name] = {
                "employee_id": employee_id,
                "total_hours": round(self.staff_hours[employee_id], 2),
                "shifts": [
                    {
                        "shift_id": shift.id,
                        "date": str(shift.shift_date),
                        "start_time": str(shift.start_time),
                        "end_time": str(shift.end_time),
                        "duration_hours": round(self._shift_duration(shift), 2),
                        "required_skill": (
                            shift.required_skill.name
                            if shift.required_skill_id
                            else None
                        ),
                    }
                    for shift in shifts_list
                ],
            }

        return {
            "schedule": schedule_summary,
            "unscheduled_shifts": [
                {
                    "shift_id": shift.id,
                    "date": str(shift.shift_date),
                    "start_time": str(shift.start_time),
                    "end_time": str(shift.end_time),
                    "required_skill": (
                        shift.required_skill.name if shift.required_skill_id else None
                    ),
                }
                for shift in self.unscheduled_shifts
            ],
        }

    # ------------------------------------------------------------------
    # Convenience: run everything in one call
    # ------------------------------------------------------------------

    @classmethod
    def run(cls, business_id, shifts, max_hours_per_week=40):
        """
        Shortcut: schedule, apply, and return the full summary in one call.

        Usage:
            result = GreedyStaffScheduler.run(business_id=1, shifts=shifts_qs)

        Returns:
            dict: Combined apply summary + schedule summary.
        """
        scheduler = cls(business_id, shifts, max_hours_per_week)
        scheduler.schedule_shifts_greedy()
        apply_result = scheduler.apply_schedule()
        summary = scheduler.get_schedule_summary()
        return {**apply_result, **summary}