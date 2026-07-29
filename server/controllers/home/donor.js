const Donor = require('../../models/Donor');
const bcrypt = require('bcrypt');
const joi = require('joi');

// Controller function
const DonorUser = async (req, res, next) => {
  try {
    // Clone and clean data
    const dataToValidate = { ...req.body };
    delete dataToValidate.retypePassword;

    // Validate request body
    const { error: validationError } = validateUser(dataToValidate);
    if (validationError) {
      const error = new Error(validationError.details[0].message);
      error.statusCode = 400;
      throw error;
    }

    const {
      fullName,
      bloodGroup,
      mobileNumber,
      country,
      state,
      district,
      city,
      email,
      password,
      isAvailable,
      authorize,
    } = dataToValidate;

    const formattedName = fullName.trim().toLowerCase();
    const formattedEmail = email.trim().toLowerCase();
    const queryEmail = String(formattedEmail);

    const findedUser = await Donor.findOne({
      email: queryEmail
    });
    if (findedUser) {
      const error = new Error('This email already exists');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new donor
    const newDonor = new Donor({
      fullName: formattedName,
      email: formattedEmail,
      password: hashedPassword,
      bloodGroup,
      mobileNumber,
      country,
      state,
      district,
      city,
      isAvailable,
      authorize,
    });

    const savedUser = await newDonor.save();

    // Success response
    res.status(201).json({
      message: 'Donor registered successfully',
      status: true,
      name: savedUser.fullName,
    });

  } catch (error) {
    console.error('Error in Donor register controller:', error.message);
    next(error); // Pass to global error middleware
  }
};

// Joi validation
function validateUser(data) {
  const userSchema = joi.object({
    fullName: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(7).max(30).required(),
    mobileNumber: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must be a 10-digit number',
        'string.empty': 'Mobile number is required',
      }),
    bloodGroup: joi.string().required(),
    country: joi.string().required(),
    state: joi.string().required(),
    district: joi.string().required(),
    city: joi.string().required(),
    isAvailable: joi.boolean(),
    authorize: joi.boolean(),
  });

  return userSchema.validate(data);
}

module.exports = DonorUser;
