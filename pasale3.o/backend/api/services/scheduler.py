# your_app/services/scheduler.py

from datetime import date, timedelta
from django.db.models import Q
from api.models import Employee, Shift, EmployeeSkill, EmployeeSchedule


# CONFIGURATION


WEIGHTS = {
    "availability":  0.30,
    "skill_match":   0.25,
    "fairness":      0.20,
    "skill_level":   0.15,
    "cost":          0.10,
}

PROFICIENCY_SCORE = {
    "Beginner":     0.4,
    "Intermediate": 0.7,
    "Advanced":     1.0,
}

# ----------------------------------------
# HELPERS
# ----------------------------------------

def normalize(value, min_val, max_val):
    if max_val == min_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)


def is_available(employee, shift):
    return not EmployeeSchedule.objects.filter(
        employee=employee,
        date=shift.shift_date,
    ).filter(
        Q(start_time__lt=shift.end_time) &
        Q(end_time__gt=shift.start_time)
    ).exists()


def get_shifts_this_week(employee, shift_date, max_hours_per_week=40):
    week_start = shift_date - timedelta(days=shift_date.weekday())
    week_end   = week_start + timedelta(days=6)
    return Shift.objects.filter(
        assigned_employee=employee,
        shift_date__range=(week_start, week_end),
        is_scheduled=True,
    ).count()


def get_skill_match(employee, shift):
    if not shift.required_skill:
        return True, 1.0
    try:
        emp_skill = EmployeeSkill.objects.get(
            employee=employee,
            skill=shift.required_skill
        )
        return True, PROFICIENCY_SCORE.get(emp_skill.proficiency_level, 0.4)
    except EmployeeSkill.DoesNotExist:
        return False, 0.0



class WSMStaffScheduler:
    def __init__(self, business_id, shifts, max_hours_per_week=40):
        self.business_id       = business_id
        self.shifts            = shifts
        self.max_hours         = max_hours_per_week
        self.schedule          = []   # list of (shift, employee, score)
        self.unscheduled       = []   # list of shifts with no eligible employee
        self.all_employees     = Employee.objects.filter(
            business_id=business_id,
            status__name="Active"
        )

    # ----------------------------------------
    # CORE: Compute WSM score for one employee-shift pair
    # ----------------------------------------
    def _compute_score(self, employee, shift):
        if not self.all_employees.exists():
            return -1

        # Hard Gate 1: Availability
        if not is_available(employee, shift):
            return -1

        # Hard Gate 2: Skill Match
        has_skill, proficiency = get_skill_match(employee, shift)
        if not has_skill:
            return -1

        # Fairness
        # Pre-compute current shifts for all to find the max
        emp_shift_counts = [get_shifts_this_week(e, shift.shift_date) for e in self.all_employees]
        max_shifts = max(emp_shift_counts) if emp_shift_counts else 1
        weekly_shifts = get_shifts_this_week(employee, shift.shift_date)
        fairness = 1.0 - normalize(weekly_shifts, 0, max_shifts)

        # Cost
        salaries = [float(e.salary) for e in self.all_employees]
        min_salary = min(salaries) if salaries else 0
        max_salary = max(salaries) if salaries else 1
        cost = 1.0 - normalize(float(employee.salary), min_salary, max_salary)

        score = (
            WEIGHTS["availability"] * 1.0        +
            WEIGHTS["skill_match"]  * 1.0        +
            WEIGHTS["fairness"]     * fairness    +
            WEIGHTS["skill_level"]  * proficiency +
            WEIGHTS["cost"]         * cost
        )
        return round(score, 4)

    # ----------------------------------------
    # RANK employees for a single shift
    # ----------------------------------------
    def _rank_employees(self, shift):
        rankings = []
        for emp in self.all_employees:
            score = self._compute_score(emp, shift)
            if score >= 0:
                rankings.append((emp, score))
        rankings.sort(key=lambda x: x[1], reverse=True)
        return rankings

    # ----------------------------------------
    # MAIN: Schedule all shifts (replaces schedule_shifts_greedy)
    # ----------------------------------------
    def schedule_shifts_greedy(self):
        """
        Kept the same method name as GreedyStaffScheduler
        so your existing StaffSchedulerView works without changes
        """
        for shift in self.shifts.order_by('shift_date', 'start_time'):
            rankings = self._rank_employees(shift)
            if rankings:
                best_employee, best_score = rankings[0]
                self.schedule.append({
                    "shift":    shift,
                    "employee": best_employee,
                    "score":    best_score,
                    "rankings": [
                        {"employee": e.name, "score": s}
                        for e, s in rankings
                    ]
                })
            else:
                self.unscheduled.append(shift)

        return self.schedule, self.unscheduled

    # ----------------------------------------
    # APPLY: Save assignments to database
    # ----------------------------------------
    def apply_schedule(self):
        applied = []
        for entry in self.schedule:
            shift    = entry["shift"]
            employee = entry["employee"]

            shift.assigned_employee = employee
            shift.is_scheduled      = True
            shift.save()

            EmployeeSchedule.objects.get_or_create(
                employee   = employee,
                date       = shift.shift_date,
                start_time = shift.start_time,
                end_time   = shift.end_time,
            )
            applied.append({
                "shift_id":   shift.id,
                "shift_date": str(shift.shift_date),
                "start_time": str(shift.start_time),
                "end_time":   str(shift.end_time),
                "assigned":   employee.name,
                "score":      entry["score"],
            })

        return {
            "scheduled_count":   len(applied),
            "unscheduled_count": len(self.unscheduled),
            "total_shifts":      len(self.schedule) + len(self.unscheduled),
            "success_rate":      f"{(len(applied) / (len(applied) + len(self.unscheduled)) * 100):.2f}%"
                                 if (applied or self.unscheduled) else "0%",
            "assignments":       applied,
        }

    # ----------------------------------------
    # SUMMARY: Matches your existing get_schedule_summary()
    # ----------------------------------------
    def get_schedule_summary(self):
        summary = {}
        for entry in self.schedule:
            emp_name = entry["employee"].name
            if emp_name not in summary:
                summary[emp_name] = {
                    "employee":       emp_name,
                    "shifts_assigned": 0,
                    "shift_dates":    [],
                    "avg_score":      0,
                    "scores":         [],
                }
            summary[emp_name]["shifts_assigned"] += 1
            summary[emp_name]["shift_dates"].append(str(entry["shift"].shift_date))
            summary[emp_name]["scores"].append(entry["score"])

        # Calculate average score per employee
        for emp in summary.values():
            emp["avg_score"] = round(
                sum(emp["scores"]) / len(emp["scores"]), 4
            )
            del emp["scores"]  # clean up before returning

        return {
            "total_scheduled":   len(self.schedule),
            "total_unscheduled": len(self.unscheduled),
            "unscheduled_shift_ids": [s.id for s in self.unscheduled],
            "employee_summary":  list(summary.values()),
        }