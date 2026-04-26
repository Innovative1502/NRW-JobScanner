self.addEventListener("push", e => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.company,
    data: { url: data.link }
  });
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  clients.openWindow(e.notification.data.url);
});
