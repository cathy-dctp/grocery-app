# Generated manually to remove unique constraint from GroceryListItem

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('grocery_list', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='grocerylistitem',
            unique_together=set(),
        ),
    ]