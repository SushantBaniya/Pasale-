from datetime import datetime, timedelta
from collections import defaultdict
from django.db import transaction
from ..models import Employee, Shift, EmployeeSkill, EmployeeSchedule


class GreedyStaffScheduler:
    """
    Implements a greedy algorithm for staff scheduling.

    Strategy:
    1. Sort shifts by duration (longest first) - harder to fill shifts are scheduled first
    2. For each shift, find available employees who:
       - Have the required skill (if specified)
       - Are not exceeding max hours per week
       - Have availability for the shift time
    3. Assign to employee with least scheduled hours (load balancing)
    """

    def __init__(self, business_id, shifts, max_hours_per_week=40):
        """
        Initialize the scheduler.

        Args:
            business_id: Business ID to schedule for
            shifts: QuerySet or list of Shift objects
            max_hours_per_week: Maximum hours an employee can work per week
        """
        self.business_id = business_id
        self.shifts = shifts
        self.max_hours_per_week = max_hours_per_week
        self.schedule = defaultdict(list)
        self.staff_hours = defaultdict(float)
        self.unscheduled_shifts = []

    def calculate_shift_duration(self, shift):
        """Calculate hours for a shift"""
        delta = datetime.combine(shift.shift_date, shift.end_time) - datetime.combine(
            shift.shift_date, shift.start_time
        )
        return delta.total_seconds() / 3600

    def get_employee_hours_this_week(self, employee_id, shift_date):
        """Get total hours scheduled for employee in the week containing shift_date"""
        # Find week start (Monday)
        week_start = shift_date - timedelta(days=shift_date.weekday())
        week_end = week_start + timedelta(days=6)

        schedules = EmployeeSchedule.objects.filter(
            employee_id=employee_id,
            date__gte=week_start,
            date__lte=week_end
        )

        total_hours = 0
        for schedule in schedules:
            delta = datetime.combine(schedule.date, schedule.end_time) - datetime.combine(
                schedule.date, schedule.start_time
            )
            total_hours += delta.total_seconds() / 3600

        return total_hours

    def has_required_skill(self, employee, shift):
        """Check if employee has the required skill"""
        if not shift.required_skill:
            return True

        has_skill = EmployeeSkill.objects.filter(
            employee=employee,
            skill=shift.required_skill
        ).exists()

        return has_skill

    def is_employee_available(self, employee, shift):
        """Check if employee can be assigned to this shift"""
        if employee.status and employee.status.name == 'Inactive':
            return False

        # Check if employee can work this shift (no overlaps)
        shift_start = datetime.combine(shift.shift_date, shift.start_time)
        shift_end = datetime.combine(shift.shift_date, shift.end_time)

        overlapping = EmployeeSchedule.objects.filter(
            employee=employee,
            date=shift.shift_date,
            start_time__lt=shift.end_time,
            end_time__gt=shift.start_time
        ).exists()

        if overlapping:
            return False

        # Check skill requirement
        if not self.has_required_skill(employee, shift):
            return False

        # Check hours constraint
        current_hours = self.get_employee_hours_this_week(
            employee.id, shift.shift_date
        )
        shift_duration = self.calculate_shift_duration(shift)

        if current_hours + shift_duration > self.max_hours_per_week:
            return False

        return True

    def schedule_shifts_greedy(self):
        """
        Execute greedy scheduling algorithm.

        Returns:
            tuple: (schedule dict, list of unscheduled shifts)
        """
        # Sort shifts by duration (descending) - longest/hardest to fill first
        sorted_shifts = sorted(
            self.shifts,
            key=lambda s: self.calculate_shift_duration(s),
            reverse=True
        )

        for shift in sorted_shifts:
            # Get all employees for this business
            employees = Employee.objects.filter(
                business_id=self.business_id
            ).order_by('name')

            # Filter to available employees
            available_employees = [
                emp for emp in employees if self.is_employee_available(emp, shift)
            ]

            if not available_employees:
                self.unscheduled_shifts.append(shift)
                continue

            # Greedy choice: pick employee with least hours this week (load balancing)
            selected_employee = min(
                available_employees,
                key=lambda emp: self.get_employee_hours_this_week(
                    emp.id, shift.shift_date
                )
            )

            # Assign the shift
            shift_duration = self.calculate_shift_duration(shift)
            self.schedule[selected_employee.id].append(shift)
            self.staff_hours[selected_employee.id] += shift_duration

        return self.schedule, self.unscheduled_shifts

    @transaction.atomic
    def apply_schedule(self):
        """
        Apply the scheduled shifts to the database.
        Creates EmployeeSchedule records and updates Shift assignments.

        Returns:
            dict: Summary of scheduled and unscheduled shifts
        """
        scheduled_count = 0
        unscheduled_count = len(self.unscheduled_shifts)

        for employee_id, shifts_list in self.schedule.items():
            for shift in shifts_list:
                # Create EmployeeSchedule record
                EmployeeSchedule.objects.create(
                    employee_id=employee_id,
                    date=shift.shift_date,
                    start_time=shift.start_time,
                    end_time=shift.end_time
                )

                # Update Shift assignment
                shift.assigned_employee_id = employee_id
                shift.is_scheduled = True
                shift.save()

                scheduled_count += 1

        return {
            'scheduled_count': scheduled_count,
            'unscheduled_count': unscheduled_count,
            'total_shifts': len(self.shifts),
            'success_rate': f"{(scheduled_count / len(self.shifts) * 100):.2f}%" if self.shifts else "0%"
        }

    def get_schedule_summary(self):
        """Get a human-readable summary of the schedule"""
        summary = {}

        for employee_id, shifts_list in self.schedule.items():
            employee = Employee.objects.get(id=employee_id)
            summary[employee.name] = {
                'employee_id': employee.id,
                'shifts': [
                    {
                        'shift_id': shift.id,
                        'date': str(shift.shift_date),
                        'start_time': str(shift.start_time),
                        'end_time': str(shift.end_time),
                        'duration_hours': self.calculate_shift_duration(shift),
                        'required_skill': shift.required_skill.name if shift.required_skill else 'None'
                    }
                    for shift in shifts_list
                ],
                'total_hours': self.staff_hours[employee_id]
            }

        return {
            'schedule': summary,
            'unscheduled_shifts': [
                {
                    'shift_id': shift.id,
                    'date': str(shift.shift_date),
                    'start_time': str(shift.start_time),
                    'end_time': str(shift.end_time),
                    'required_skill': shift.required_skill.name if shift.required_skill else 'None'
                }
                for shift in self.unscheduled_shifts
            ]
        }
