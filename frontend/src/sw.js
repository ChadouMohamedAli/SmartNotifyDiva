// public/sw.js
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.head || "Notification";
    const options = {
        body: data.body || "Nouveau message reçu.",
        icon: data.icon || "/logo192.png",
        badge: "/logo192.png",
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
