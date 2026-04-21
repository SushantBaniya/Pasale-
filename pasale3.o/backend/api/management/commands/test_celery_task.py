
from django.core.management.base import BaseCommand
from api.models import Business, AprioriRule
from api.tasks import retrain_apriori_for_business
from api.utils.apiriori_utils import load_rules_from_db


class Command(BaseCommand):
    help = 'Tests the Celery retrain task manually'

    def handle(self, *args, **kwargs):

        try:
            business = Business.objects.get(
                business_name='Sharma General Store'
            )
        except Business.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                '❌ Run seed_apriori_data first'
            ))
            return

        self.stdout.write('\n' + '='*60)
        self.stdout.write('     CELERY TASK TEST (manual run)')
        self.stdout.write('='*60)

        # Run task directly (without Celery worker for testing)
        self.stdout.write('\n🔄 Running retrain task...')
        result = retrain_apriori_for_business(business_id=business.id)

        self.stdout.write(f'\n📊 Task Result:')
        for key, value in result.items():
            self.stdout.write(f'   {key}: {value}')

        # Show saved rules from database
        self.stdout.write('\n📋 Rules now saved in database:')
        saved_rules = AprioriRule.objects.filter(
            business_id=business
        ).order_by('-confidence')

        for rule in saved_rules:
            self.stdout.write(
                f'   {rule.antecedent} → {rule.consequent} | '
                f'Confidence: {rule.confidence:.0%} | '
                f'Lift: {rule.lift}'
            )

        # Load rules via helper function
        self.stdout.write('\n📡 Loading rules via load_rules_from_db():')
        loaded = load_rules_from_db(business_id=business.id)
        self.stdout.write(f'   Total rules loaded: {len(loaded)}')
        self.stdout.write(f'   Sample: {loaded[0] if loaded else "none"}')

        self.stdout.write('\n' + '='*60)
        self.stdout.write('     TASK TEST COMPLETE ✅')
        self.stdout.write('='*60 + '\n')