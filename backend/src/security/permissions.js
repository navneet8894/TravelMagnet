const ROLE_PERMISSIONS=Object.freeze({
  admin:["*"],
  vendor:["hotels.view","hotels.create","rooms.view","rooms.create","rooms.update","rates.view","rates.update","bookings.view","bookings.confirm","bookings.cancel","bookings.checkin","bookings.checkout","guests.view","payments.view","payments.record","invoices.view","invoices.create","invoices.download","reports.view","exports.create"],
  user:["bookings.view","bookings.create","bookings.cancel","payments.view","invoices.view","invoices.download"],
});
const hasPermission=(user,permission,assignedPermissions)=>Array.isArray(assignedPermissions)?assignedPermissions.includes("*")||assignedPermissions.includes(permission):Boolean(ROLE_PERMISSIONS[user?.role]?.includes(permission));
module.exports={ROLE_PERMISSIONS,hasPermission};
