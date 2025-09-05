from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Item(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="items"
    )
    description = models.TextField(blank=True)
    barcode = models.CharField(max_length=50, blank=True, null=True)
    default_unit = models.CharField(max_length=20, default="piece")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = [["name", "category"]]

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class GroceryList(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="grocery_lists"
    )
    shared_with = models.ManyToManyField(
        User, blank=True, related_name="shared_grocery_lists"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} (by {self.owner.username})"


class GroceryListItem(models.Model):
    grocery_list = models.ForeignKey(
        GroceryList, on_delete=models.CASCADE, related_name="items"
    )
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    custom_name = models.CharField(
        max_length=200, blank=True, help_text="Custom name for this item in this list"
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    is_checked = models.BooleanField(default=False)
    checked_at = models.DateTimeField(null=True, blank=True)
    checked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_items",
    )
    added_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="added_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_checked", "item__name"]

    def __str__(self):
        return (
            f"{self.quantity} {self.unit or self.item.default_unit} of {self.item.name}"
        )

    def save(self, *args, **kwargs):
        if not self.unit:
            self.unit = self.item.default_unit
        super().save(*args, **kwargs)
