from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align:center">WarLock Battle!!!</h1>'
    line3 = '<hr>'
    line2 = '<img src="https://cdn.getimg.net/wall/2020/03/2020032608121644.jpg!wall.png">'
    line4 = '<a href="/play/">Enter the play page</a>'  # link to the play page
    return HttpResponse(line1 + line3 + line4 + line2)

def play(request):
    line = '<h1 style="text-align: centre">Play the Game!</h1>'
    line2 = '<a href="/">Back to the Homepage</a>'
    return HttpResponse(line + line2)