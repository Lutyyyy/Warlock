from django.contrib import admin
from django.urls import path
from game.views import index, play

urlpatterns = [
    path("", index, name="game_index"),
    path("play/", play, name="play"),
]