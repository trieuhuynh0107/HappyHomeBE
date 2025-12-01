const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middlewares/auth');
const { 
  registerValidation, 
  loginValidation, 
  validate 
} = require('../validators/authValidator');

/**
 * @api {POST} /api/auth/register Register Account
 * @apiVersion 1.0.0
 * @apiName Register
 * @apiGroup Authentication
 * @apiPermission Public
 *
 * @apiDescription Đăng ký tài khoản Customer mới. Sau khi đăng ký thành công, hệ thống tự động tạo JWT token để user có thể sử dụng ngay.
 *
 * @apiBody {String} email Email của user (phải là email hợp lệ, sẽ được normalize)
 * @apiBody {String} password Mật khẩu (tối thiểu 6 ký tự)
 * @apiBody {String} full_name Họ tên đầy đủ (không để trống, tối đa 100 ký tự)
 * @apiBody {String} [phone] Số điện thoại (optional, phải là 10-11 chữ số nếu có)
 *
 * @apiExample {curl} Example usage:
 * curl -i -X POST http://localhost:3000/api/auth/register \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "customer@example.com",
 *     "password": "123456",
 *     "full_name": "Nguyen Van A",
 *     "phone": "0901234567"
 *   }'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {String} message Thông báo kết quả
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.user Thông tin user vừa đăng ký
 * @apiSuccess {Number} data.user.id ID của user
 * @apiSuccess {String} data.user.email Email của user
 * @apiSuccess {String} data.user.full_name Họ tên của user
 * @apiSuccess {String} data.user.phone Số điện thoại của user
 * @apiSuccess {String} data.user.role Role của user (mặc định: CUSTOMER)
 * @apiSuccess {String} data.token JWT token để xác thực (expires in 7 days)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Đăng ký thành công",
 *       "data": {
 *         "user": {
 *           "id": 1,
 *           "email": "customer@example.com",
 *           "full_name": "Nguyen Van A",
 *           "phone": "0901234567",
 *           "role": "CUSTOMER"
 *         },
 *         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       }
 *     }
 *
 * @apiError (400) ValidationError Dữ liệu đầu vào không hợp lệ
 * @apiError (400) EmailExisted Email đã được sử dụng
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Validation Error:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dữ liệu không hợp lệ",
 *       "errors": [
 *         {
 *           "field": "email",
 *           "message": "Email không hợp lệ"
 *         },
 *         {
 *           "field": "password",
 *           "message": "Mật khẩu phải có ít nhất 6 ký tự"
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample Email Already Exists:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Email đã được sử dụng"
 *     }
 */
router.post(
  '/register',
  registerValidation,
  validate,
  authController.register
);

/**
 * @api {POST} /api/auth/login Login
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup Authentication
 * @apiPermission Public
 *
 * @apiDescription Đăng nhập vào hệ thống. Hỗ trợ cả ADMIN và CUSTOMER. Trả về JWT token sau khi đăng nhập thành công.
 *
 * @apiBody {String} email Email đăng nhập
 * @apiBody {String} password Mật khẩu
 *
 * @apiExample {curl} Example usage:
 * curl -i -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "email": "customer@example.com",
 *     "password": "123456"
 *   }'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {String} message Thông báo kết quả
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.user Thông tin user
 * @apiSuccess {Number} data.user.id ID của user
 * @apiSuccess {String} data.user.email Email của user
 * @apiSuccess {String} data.user.full_name Họ tên của user
 * @apiSuccess {String} data.user.phone Số điện thoại của user
 * @apiSuccess {String} data.user.role Role của user (ADMIN hoặc CUSTOMER)
 * @apiSuccess {String} data.token JWT token để xác thực (expires in 7 days)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Đăng nhập thành công",
 *       "data": {
 *         "user": {
 *           "id": 1,
 *           "email": "customer@example.com",
 *           "full_name": "Nguyen Van A",
 *           "phone": "0901234567",
 *           "role": "CUSTOMER"
 *         },
 *         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       }
 *     }
 *
 * @apiError (400) ValidationError Dữ liệu đầu vào không hợp lệ
 * @apiError (401) Unauthorized Email hoặc mật khẩu không đúng
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Validation Error:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dữ liệu không hợp lệ",
 *       "errors": [
 *         {
 *           "field": "email",
 *           "message": "Email không hợp lệ"
 *         },
 *         {
 *           "field": "password",
 *           "message": "Mật khẩu không được để trống"
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample Invalid Credentials:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Email hoặc mật khẩu không đúng"
 *     }
 */
router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

/**
 * @api {GET} /api/auth/me Get Profile
 * @apiVersion 1.0.0
 * @apiName GetProfile
 * @apiGroup Authentication
 * @apiPermission Private (JWT Token Required)
 *
 * @apiDescription Lấy thông tin profile của user hiện tại. Yêu cầu JWT token hợp lệ trong header.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     }
 *
 * @apiExample {curl} Example usage:
 * curl -i -X GET http://localhost:3000/api/auth/me \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.user Thông tin user
 * @apiSuccess {Number} data.user.id ID của user
 * @apiSuccess {String} data.user.email Email của user
 * @apiSuccess {String} data.user.full_name Họ tên của user
 * @apiSuccess {String} data.user.phone Số điện thoại của user
 * @apiSuccess {String} data.user.role Role của user (ADMIN hoặc CUSTOMER)
 * @apiSuccess {String} data.user.created_at Thời gian tạo tài khoản (ISO 8601 format)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "user": {
 *           "id": 1,
 *           "email": "customer@example.com",
 *           "full_name": "Nguyen Van A",
 *           "phone": "0901234567",
 *           "role": "CUSTOMER",
 *           "created_at": "2024-01-15T10:30:00.000Z"
 *         }
 *       }
 *     }
 *
 * @apiError (401) MissingToken Không tìm thấy token xác thực
 * @apiError (401) InvalidToken Token không hợp lệ hoặc đã hết hạn
 * @apiError (401) UserNotFound User không tồn tại trong hệ thống
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Missing Token:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Không tìm thấy token xác thực"
 *     }
 *
 * @apiErrorExample Invalid Token:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token không hợp lệ"
 *     }
 *
 * @apiErrorExample Token Expired:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token đã hết hạn"
 *     }
 *
 * @apiErrorExample User Not Found:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "User không tồn tại"
 *     }
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

module.exports = router;