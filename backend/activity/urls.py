from django.urls import path
from .views import ActivityHistoryListView, RecentActivityListView

urlpatterns = [
    path("recent/", RecentActivityListView.as_view(), name="recent_activity"),
    path("history/", ActivityHistoryListView.as_view(), name="activity_history"),
]
