const test=require("node:test"),assert=require("node:assert/strict");
const {ROLE_PERMISSIONS,hasPermission}=require("../src/security/permissions");
const {invoiceAmounts}=require("../src/services/invoiceService");
const {bookingFields}=require("../src/controllers/exportController");
const {columns}=require("../src/controllers/bookingController");

test("role permissions deny cross-context capabilities",()=>{
  assert.equal(hasPermission({role:"vendor"},"bookings.view"),true);
  assert.equal(hasPermission({role:"user"},"exports.create"),false);
  assert.equal(hasPermission({role:"admin"},"hotels.approve",["hotels.approve"]),true);
  assert.equal(hasPermission({role:"admin"},"hotels.approve",["reports.view"]),false);
  assert.ok(Object.isFrozen(ROLE_PERMISSIONS));
});

test("invoice values are calculated from the server price snapshot",()=>{
  const result=invoiceAmounts({roomPrice:2500,nights:2,numberOfRooms:1,totalAmount:5040,priceSnapshot:{subtotal:5000,discountAmount:500,taxAmount:540}});
  assert.deepEqual(result,{subtotal:5000,discount:500,tax:540,total:5040});
});

test("booking table keeps backend-owned default columns even with no rows",()=>{
  assert.ok(columns.length>0);
  assert.equal(columns[0].key,"hotelName");
  assert.ok(columns.some(column=>column.defaultVisible===false));
});

test("booking exports expose only an explicit allowlist",()=>{
  assert.equal(bookingFields.invoiceNumber,"Booking No.");
  assert.equal(bookingFields.password,undefined);
  assert.equal(bookingFields["user.email"],"Guest Email");
});
