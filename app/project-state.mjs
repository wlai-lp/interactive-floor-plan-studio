/**
 * Toggle the room light controlled by a light device. Non-light devices leave
 * the project unchanged so the SVG interaction can share one activation path.
 *
 * @template {{ rooms: Array<{ id: string, light: boolean }> }} T
 * @param {T} project
 * @param {{ roomId: string, type: "light" | "sensor" | "plug" }} device
 * @returns {T}
 */
export function toggleLightForDevice(project, device) {
  if (device.type !== "light") return project;
  return {
    ...project,
    rooms: project.rooms.map((room) =>
      room.id === device.roomId ? { ...room, light: !room.light } : room,
    ),
  };
}
