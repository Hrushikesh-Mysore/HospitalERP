// The active role, mirrored here so api() can send it. RoleProvider keeps it current.
// Demo-level only: the server trusts these headers; real use needs authentication.
export const actor = { role: 'Admin', doctorId: 1, patientToken: null }
