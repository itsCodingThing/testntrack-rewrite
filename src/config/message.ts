export const success = {
    message: "success",
    statusCode: 200,
    message_status: true,
};
export const unAuthorize = {
    message: "Unauthorized",
    statusCode: 401,
    status_code: 401,
};
export const unAuthorizeToken = {
    message: "Invalid authorization token",
    token_expired: "Authorization token expired",
    statusCode: 403,
    status_code: 403,
};
export const user_otp = {
    success_otp: "OTP succcessfully send",
    error_otp: "Unable to send OTP",
};
export const profile = { update_successfully: "User profile updated successfully" };
export const copy_check = {
    checked_successfully: "Copy checked successfully",
    checked_already: "Copy checked already",
    pending_result: "Result declared successfully",
};
export const exam_schedule = {
    schedule_successfully: "Exam scheduled successfully",
};
export const student_exam = {
    duration_complete: "Exam time completed",
    student_complete: "Student already submitted exam",
    copy_exists: "Student copy already exists",
    copy_submit: "Student already submitted copy",
    copy_submit_duration: "Copy submit duration completed",
    copy_submit_successfully: "Copy submitted successfully",
    rejoin_complete: "Student rejoin completed",
};
export const login_error = {
    message: "Invalid email or password",
    not_verified_message: "Your account has not verified yet. Please verify your account first",
    inactive_message: "Your account has been deactivated. Please contact to administrator and try again",
    deleted_message: "Your account has been deleted. Please contact to administrator and try again",
    blocked_message: "Your account has been blocked. Please contact to administrator and try again",
    role_assign: "You are not authorize to login. Please contact to administrator and try again",
    not_found: "You are not registered with us",
    statusCode: "401",
};
export const registration_error = {
    message: "Invalid request",
    statusCode: 401,
};
export const not_found_error = {
    message: "Not Found",
    statusCode: 400,
};
export const admin_user_error = {
    statusCode: 400,
    not_found: "Admin does not exists",
    invalid_password: "Invalid password. Please enter correct password and try again",
    email_already_exists: "Email already register with us",
};
export const master_validation = {
    statusCode: 400,
    status_code: 400,
    success_login: "Login successfully",
    not_found: "User does not exists",
    field: "REPLACE missing or empty",
    check_json_body: "Please check json request body",
    check_field: "Please check all fields",
    email: "Email cannot be empty",
    password: "Password cannot be empty",
    email_already_exists: "Email already register with us",
    mobile_already_exists: "Mobile no already register with us",
    user_id: "User id cannot be empty",
    invalid_old_password: "Invalid old password. Please enter correct password and try again",
    invalid_school_code: "No school found",
    school_id_required: "School id is required",
    invalid_type: "Invalid type",
    invalid_field: "Invalid field",
    id: "id missing or empty",
    invalid_mongodb_id: "Invalid mongodb object id",
    no_valid_paper: "No valid paper exists",
};
export const user_validation = {
    statusCode: 400,
    status_code: 400,
    not_found: "User does not exists",
    user_exists: "User already exists",
    error_registration: "Unable to register user, please try again later",
    email: "Email cannot be empty",
    no_email: "Email not register with us",
    password: "Password cannot be empty",
    mobile_number: "Mobile number cannot be empty",
    email_already_exists: "Email already register with us",
    mobile_already_exists: "Mobile no already register with us",
    mobile_email_already_exists: "Mobile no or email already register with us",
    mobile_email: "Either fill mobile number or email",
    invalid_mobile: "Invalid mobile number",
    user_id: "User id cannot be empty",
    id: "id cannot be empty",
    new_password: "New Password cannot be empty",
    old_password: "Old Password cannot be empty",
    invalid_old_password: "Invalid old password. Please enter correct password and try again",
    otp: "OTP cannot be empty",
    otp_verify: "Invalid OTP. Please enter correct OTP and try again",
    device_not_found: "User device not found",
    name_already_exists: "Name already exists",
    enter_valid_copy_id: "Enter Valid Copy Ids",
    name: "Name is Required",
};
export const evaluator = {
    enter_board: "Boards List Not Present",
    enter_classes: "Classes List Not Present",
    enter_subjects: "Subjects List Not Present",
};
export const enquiry_validation = {
    not_found: "Enquiry not found",
    already_exists: "An enquiry already exist with this number",
};
export const marketpaperbundle = {
    alreadyPurchased: "Bundle is already purchased by student",
    notUnclocked: "Paper not unlocked yet",
};
export const vendorValidation = {
    alreadyExistWithSameCode: "Vendor Already exist with the same code",
};
