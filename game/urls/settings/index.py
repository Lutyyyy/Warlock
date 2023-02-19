from django.urls import path
from game.views.settings.getinfo import getinfo
from game.views.settings.signin import signin
from game.views.settings.signout import signout
from game.views.settings.register import register

urlpatterns = [
    path("getinfo/", getinfo, name="settings/getinfo"),
    path("login/", signin, name="settings/login"),
    path("logout/", signout, name="settings/logout"),
    path("register/", register, name="settings/register"),
]