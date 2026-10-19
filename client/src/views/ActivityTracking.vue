<script setup>
import { ref, computed, onMounted } from "vue";
import BaseFolder from "../components/FolderTabs.vue";
import ActivityCard from "../components/ActivityCard.vue";
import { useActivities } from "../composables/useActivities";
import { useAuth } from "../composables/useAuth";

const {
  activities,
  loadActivities,
  setInterested,
  setGoing,
  saveNote,
  deleteActivity,
} = useActivities();
const { userId } = useAuth();

const loading = ref(true);
const error = ref("");
const tabs = [
  { id: "interested", label: "INTERESTED", theme: "theme-orange" },
  { id: "attending", label: "ATTENDING", theme: "theme-green" },
  { id: "attended", label: "ATTENDED", theme: "theme-grey" },
];

// an event can appear in more than one tab
const hasSession = (a, status) => a.sessions.some((s) => s.going === status);
const matches = {
  interested: (a) => a.interested,
  attending: (a) => hasSession(a, "attending"),
  attended: (a) => hasSession(a, "attended"),
};

// sort by the earliest session relevant to the tab
function sortKey(a, tab) {
  const times =
    tab === "interested"
      ? a.event.sessions.map((s) => new Date(s.startTime).getTime())
      : a.sessions
          .filter((s) => s.going === tab)
          .map((s) => new Date(s.startTime).getTime());
  return Math.min(...times);
}

const byStatus = computed(() => {
  const out = {};
  for (const t of tabs) {
    out[t.id] = activities.value
      .filter((a) => a.event && matches[t.id](a))
      .sort((a, b) => sortKey(a, t.id) - sortKey(b, t.id));
  }
  return out;
});

onMounted(async () => {
  try {
    await loadActivities();
  } catch {
    error.value = "Could not load your activity.";
  }
  loading.value = false;
});
</script>

<template>
  <div class="container py-3">
    <h4 class="mb-3 text-dark">Activity Tracking</h4>

    <p v-if="!userId" class="text-danger">
      Please log in to see your activity.
    </p>
    <p v-else-if="loading" class="text-muted">Loading...</p>
    <p v-else-if="error" class="text-danger">{{ error }}</p>

    <BaseFolder v-else :tabs="tabs">
      <template v-for="t in tabs" :key="t.id" #[t.id]>
        <p v-if="byStatus[t.id].length === 0" class="text-dark mb-0">
          No {{ t.id }} events yet. Mark events from the search page.
        </p>
        <div v-else class="row g-3">
          <div class="col-md-6" v-for="a in byStatus[t.id]" :key="a._id">
            <ActivityCard
              :activity="a"
              :tab="t.id"
              @set-interested="(v) => setInterested(a.event._id, v)"
              @set-going="(p) => setGoing(a.event._id, p)"
              @save-note="(n) => saveNote(a.event._id, n)"
              @remove="deleteActivity(a.event._id)"
            />
          </div>
        </div>
      </template>
    </BaseFolder>
  </div>
</template>
