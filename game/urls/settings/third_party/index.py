from django.urls import path
from game.views.settings.OAuth.apply_code import apply_code
from game.views.settings.OAuth.receive_code import receive_code

urlpatterns = [
    path("apply_code/", apply_code, name="settings/OAuth/apply_code"),
    path("receive_code/", receive_code, name="settings/OAuth/receive_code"),
]