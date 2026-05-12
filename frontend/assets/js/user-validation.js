const ZoroUserValidation = (() => {
  const oldNicPattern = /^[0-9]{9}[Vv]$/;
  const newNicPattern = /^[0-9]{12}$/;
  const drivingLicensePattern = /^[A-Za-z0-9]{8,10}$/;

  const messages = {
    nic: "NIC must be 9 digits followed by V, or 12 digits.",
    drivingLicense: "Driving license must be 8 to 10 letters or numbers.",
  };

  const clean = (value) => (value || "").trim();

  const isValidNic = (value) => {
    const nic = clean(value);
    return oldNicPattern.test(nic) || newNicPattern.test(nic);
  };

  const isValidDrivingLicense = (value) => drivingLicensePattern.test(clean(value));

  const validateNic = (value) => (isValidNic(value) ? "" : messages.nic);

  const validateDrivingLicense = (value) => (
    isValidDrivingLicense(value) ? "" : messages.drivingLicense
  );

  // Sample test cases for viva explanation.
  const examples = {
    validNic: ["911234567V", "911234567v", "199812345678"],
    invalidNic: ["", "911234567X", "91123 567V", "91123456@V", "19981234567"],
    validDrivingLicense: ["B1234567", "AB12345678"],
    invalidDrivingLicense: ["", "A123456", "AB123456789", "AB123-456", "AB 123456"],
  };

  return {
    messages,
    examples,
    clean,
    isValidNic,
    isValidDrivingLicense,
    validateNic,
    validateDrivingLicense,
  };
})();
