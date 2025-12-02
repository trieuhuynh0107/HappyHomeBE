const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middlewares/auth');
const { validateBookingRequest } = require('../validators/bookingValidator');
// ============================================
// BOOKING ROUTES (Customer only)
// ============================================

/**
 * @api {POST} /api/bookings Create Booking
 * @apiVersion 1.0.0
 * @apiName CreateBooking
 * @apiGroup Bookings
 * @apiPermission Customer (JWT Token Required)
 *
 * @apiDescription Tạo đơn đặt dịch vụ mới. Dữ liệu booking_data động phụ thuộc vào loại dịch vụ (Service). Hệ thống tự động tính toán giá cuối cùng dựa trên subservice_id và thời gian kết thúc dựa trên duration_minutes của dịch vụ.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiBody {Number} service_id ID của dịch vụ cần đặt
 * @apiBody {String} [note] Ghi chú thêm từ khách hàng (optional)
 * @apiBody {Object} booking_data Dữ liệu booking động theo form_schema của từng Service
 * @apiBody {String} booking_data.booking_date Ngày đặt dịch vụ (format: YYYY-MM-DD, VD: 2024-12-15)
 * @apiBody {String} booking_data.booking_time Giờ đặt dịch vụ (format: HH:mm, VD: 09:30)
 * @apiBody {String} [booking_data.subservice_id] ID của gói dịch vụ con để tính giá (optional, nếu không có sẽ dùng base_price)
 * @apiBody {String} booking_data.name Tên người đặt
 * @apiBody {String} booking_data.phone Số điện thoại liên hệ
 * @apiBody {String} [booking_data.address] Địa chỉ (cho dịch vụ Home Cleaning)
 * @apiBody {String} [booking_data.from_address] Địa chỉ đi (cho dịch vụ Moving)
 * @apiBody {String} [booking_data.to_address] Địa chỉ đến (cho dịch vụ Moving)
 *
 * @apiExample {curl} Example - Home Cleaning Service:
 * curl -i -X POST https://hello-node-render.onrender.com/api/bookings \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "service_id": 1,
 *     "note": "Please focus on the kitchen area",
 *     "booking_data": {
 *       "name": "Nguyen Van A",
 *       "address": "123 Le Loi Street, District 1, HCMC",
 *       "phone": "0901234567",
 *       "subservice_id": "2br",
 *       "booking_date": "2024-12-15",
 *       "booking_time": "09:00"
 *     }
 *   }'
 *
 * @apiExample {curl} Example - Moving Service:
 * curl -i -X POST https://hello-node-render.onrender.com/api/bookings \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "service_id": 2,
 *     "note": "Many fragile items, please be careful",
 *     "booking_data": {
 *       "name": "Tran Thi B",
 *       "from_address": "45 Nguyen Hue, District 1",
 *       "to_address": "78 Le Van Viet, District 9",
 *       "phone": "0987654321",
 *       "subservice_id": "truck_0t5",
 *       "booking_date": "2024-12-20",
 *       "booking_time": "14:30"
 *     }
 *   }'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {String} message Thông báo kết quả
 * @apiSuccess {Object} data Dữ liệu booking vừa tạo
 * @apiSuccess {Number} data.id ID của booking
 * @apiSuccess {Number} data.customer_id ID của khách hàng
 * @apiSuccess {Number} data.service_id ID của dịch vụ
 * @apiSuccess {String} data.start_time Thời gian bắt đầu (ISO 8601 format)
 * @apiSuccess {String} data.end_time Thời gian kết thúc (ISO 8601 format)
 * @apiSuccess {String} data.location Tóm tắt địa chỉ dịch vụ
 * @apiSuccess {String} data.status Trạng thái booking (PENDING)
 * @apiSuccess {Number} data.total_price Tổng giá dịch vụ (đã tính toán)
 * @apiSuccess {String} data.note Ghi chú của khách hàng
 * @apiSuccess {Object} data.booking_data Dữ liệu booking đầy đủ (không bao gồm booking_date, booking_time)
 * @apiSuccess {Null} data.cleaner_id Chưa được gán nhân viên (null)
 * @apiSuccess {String} data.created_at Thời gian tạo booking
 * @apiSuccess {Object} data.service Thông tin dịch vụ
 * @apiSuccess {String} data.service.name Tên dịch vụ
 * @apiSuccess {Number} data.service.base_price Giá cơ bản của dịch vụ
 *
 * @apiSuccessExample Success-Response (Home Cleaning):
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Đặt lịch thành công!",
 *       "data": {
 *         "id": 15,
 *         "customer_id": 3,
 *         "service_id": 1,
 *         "cleaner_id": null,
 *         "start_time": "2024-12-15T09:00:00.000Z",
 *         "end_time": "2024-12-15T11:00:00.000Z",
 *         "location": "123 Le Loi Street, District 1, HCMC",
 *         "status": "PENDING",
 *         "total_price": 400000,
 *         "note": "Please focus on the kitchen area",
 *         "booking_data": {
 *           "name": "Nguyen Van A",
 *           "address": "123 Le Loi Street, District 1, HCMC",
 *           "phone": "0901234567",
 *           "subservice_id": "2br"
 *         },
 *         "cancel_reason": null,
 *         "created_at": "2024-12-01T10:30:00.000Z",
 *         "service": {
 *           "name": "Home Cleaning",
 *           "base_price": 150000
 *         }
 *       }
 *     }
 *
 * @apiSuccessExample Success-Response (Moving):
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "Đặt lịch thành công!",
 *       "data": {
 *         "id": 16,
 *         "customer_id": 3,
 *         "service_id": 2,
 *         "cleaner_id": null,
 *         "start_time": "2024-12-20T14:30:00.000Z",
 *         "end_time": "2024-12-20T19:30:00.000Z",
 *         "location": "45 Nguyen Hue, District 1 ➝ 78 Le Van Viet, District 9",
 *         "status": "PENDING",
 *         "total_price": 350000,
 *         "note": "Many fragile items, please be careful",
 *         "booking_data": {
 *           "name": "Tran Thi B",
 *           "from_address": "45 Nguyen Hue, District 1",
 *           "to_address": "78 Le Van Viet, District 9",
 *           "phone": "0987654321",
 *           "subservice_id": "truck_0t5"
 *         },
 *         "cancel_reason": null,
 *         "created_at": "2024-12-01T11:00:00.000Z",
 *         "service": {
 *           "name": "Full-package House Moving",
 *           "base_price": 500000
 *         }
 *       }
 *     }
 *
 * @apiError (400) ValidationError Dữ liệu đầu vào không hợp lệ
 * @apiError (400) BookingTooSoon Đặt lịch phải trước ít nhất 30 phút so với hiện tại
 * @apiError (400) BookingTooFar Chỉ được đặt lịch trong vòng 7 ngày tới
 * @apiError (400) OutsideWorkingHours Dịch vụ chỉ hoạt động từ 7:00 đến 19:00
 * @apiError (401) Unauthorized Token không hợp lệ hoặc đã hết hạn
 * @apiError (404) ServiceNotFound Dịch vụ không tồn tại hoặc không còn hoạt động
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Validation Error:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dữ liệu không hợp lệ",
 *       "errors": [
 *         {
 *           "field": "name",
 *           "message": "Name là bắt buộc"
 *         },
 *         {
 *           "field": "address",
 *           "message": "Address là bắt buộc"
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample Missing Time Data:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Thiếu thông tin ngày (booking_date) hoặc giờ (booking_time) trong booking_data."
 *     }
 *
 * @apiErrorExample Booking Too Soon:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Vui lòng đặt lịch trước ít nhất 30 phút so với hiện tại."
 *     }
 *
 * @apiErrorExample Booking Too Far:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Chỉ được đặt lịch trong vòng 7 ngày tới."
 *     }
 *
 * @apiErrorExample Outside Working Hours:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dịch vụ chỉ hoạt động từ 7:00 đến 19:00."
 *     }
 *
 * @apiErrorExample Service Not Found:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Dịch vụ không tồn tại"
 *     }
 */
router.post('/', authenticate, validateBookingRequest, bookingController.createBooking);

/**
 * @api {GET} /api/bookings Get My Bookings
 * @apiVersion 1.0.0
 * @apiName GetMyBookings
 * @apiGroup Bookings
 * @apiPermission Customer (JWT Token Required)
 *
 * @apiDescription Lấy danh sách tất cả các booking của khách hàng hiện tại. Hỗ trợ filter theo trạng thái (status). Kết quả được sắp xếp theo thời gian tạo mới nhất.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiQuery {String="PENDING","CONFIRMED","COMPLETED","CANCELLED"} [status] Lọc theo trạng thái booking (optional)
 *
 * @apiExample {curl} Example - Get All Bookings:
 * curl -i -X GET https://hello-node-render.onrender.com/api/bookings \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiExample {curl} Example - Filter by Status:
 * curl -i -X GET "https://hello-node-render.onrender.com/api/bookings?status=PENDING" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {Object[]} data Danh sách bookings
 * @apiSuccess {Number} data.id ID của booking
 * @apiSuccess {Number} data.customer_id ID của khách hàng
 * @apiSuccess {Number} data.service_id ID của dịch vụ
 * @apiSuccess {Number} data.cleaner_id ID của nhân viên (null nếu chưa được gán)
 * @apiSuccess {String} data.start_time Thời gian bắt đầu (ISO 8601)
 * @apiSuccess {String} data.end_time Thời gian kết thúc (ISO 8601)
 * @apiSuccess {String} data.location Địa chỉ dịch vụ
 * @apiSuccess {String} data.status Trạng thái booking
 * @apiSuccess {Number} data.total_price Tổng giá
 * @apiSuccess {String} data.note Ghi chú
 * @apiSuccess {Object} data.booking_data Dữ liệu booking chi tiết
 * @apiSuccess {String} data.cancel_reason Lý do hủy (null nếu chưa hủy)
 * @apiSuccess {String} data.created_at Thời gian tạo
 * @apiSuccess {Object} data.service Thông tin dịch vụ
 * @apiSuccess {String} data.service.name Tên dịch vụ
 * @apiSuccess {Number} data.service.base_price Giá cơ bản
 * @apiSuccess {Object} [data.cleaner] Thông tin nhân viên (null nếu chưa gán)
 * @apiSuccess {String} data.cleaner.name Tên nhân viên
 * @apiSuccess {String} data.cleaner.phone Số điện thoại nhân viên
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": [
 *         {
 *           "id": 15,
 *           "customer_id": 3,
 *           "service_id": 1,
 *           "cleaner_id": 5,
 *           "start_time": "2024-12-15T09:00:00.000Z",
 *           "end_time": "2024-12-15T11:00:00.000Z",
 *           "location": "123 Le Loi Street, District 1, HCMC",
 *           "status": "CONFIRMED",
 *           "total_price": 400000,
 *           "note": "Please focus on the kitchen area",
 *           "booking_data": {
 *             "name": "Nguyen Van A",
 *             "address": "123 Le Loi Street, District 1, HCMC",
 *             "phone": "0901234567",
 *             "subservice_id": "2br"
 *           },
 *           "cancel_reason": null,
 *           "created_at": "2024-12-01T10:30:00.000Z",
 *           "service": {
 *             "name": "Home Cleaning",
 *             "base_price": 150000
 *           },
 *           "cleaner": {
 *             "name": "Le Van C",
 *             "phone": "0909123456"
 *           }
 *         },
 *         {
 *           "id": 14,
 *           "customer_id": 3,
 *           "service_id": 2,
 *           "cleaner_id": null,
 *           "start_time": "2024-12-10T14:00:00.000Z",
 *           "end_time": "2024-12-10T19:00:00.000Z",
 *           "location": "45 Nguyen Hue ➝ 78 Le Van Viet",
 *           "status": "PENDING",
 *           "total_price": 350000,
 *           "note": null,
 *           "booking_data": {
 *             "name": "Nguyen Van A",
 *             "from_address": "45 Nguyen Hue, District 1",
 *             "to_address": "78 Le Van Viet, District 9",
 *             "phone": "0901234567",
 *             "subservice_id": "truck_0t5"
 *           },
 *           "cancel_reason": null,
 *           "created_at": "2024-12-01T09:00:00.000Z",
 *           "service": {
 *             "name": "Full-package House Moving",
 *             "base_price": 500000
 *           },
 *           "cleaner": null
 *         }
 *       ]
 *     }
 *
 * @apiError (401) Unauthorized Token không hợp lệ hoặc đã hết hạn
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token không hợp lệ"
 *     }
 */
router.get('/', authenticate, bookingController.getMyBookings);

/**
 * @api {GET} /api/bookings/:id Get Booking Detail
 * @apiVersion 1.0.0
 * @apiName GetBookingDetail
 * @apiGroup Bookings
 * @apiPermission Customer (JWT Token Required)
 *
 * @apiDescription Lấy chi tiết một booking cụ thể của khách hàng. Chỉ khách hàng sở hữu booking mới có thể xem được chi tiết.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiParam {Number} id ID của booking cần lấy chi tiết
 *
 * @apiExample {curl} Example usage:
 * curl -i -X GET https://hello-node-render.onrender.com/api/bookings/15 \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {Object} data Thông tin booking chi tiết
 * @apiSuccess {Number} data.id ID của booking
 * @apiSuccess {Number} data.customer_id ID của khách hàng
 * @apiSuccess {Number} data.service_id ID của dịch vụ
 * @apiSuccess {Number} data.cleaner_id ID của nhân viên (null nếu chưa gán)
 * @apiSuccess {String} data.start_time Thời gian bắt đầu (ISO 8601)
 * @apiSuccess {String} data.end_time Thời gian kết thúc (ISO 8601)
 * @apiSuccess {String} data.location Địa chỉ dịch vụ
 * @apiSuccess {String} data.status Trạng thái booking
 * @apiSuccess {Number} data.total_price Tổng giá
 * @apiSuccess {String} data.note Ghi chú
 * @apiSuccess {Object} data.booking_data Dữ liệu booking đầy đủ
 * @apiSuccess {String} data.cancel_reason Lý do hủy (null nếu chưa hủy)
 * @apiSuccess {String} data.created_at Thời gian tạo
 * @apiSuccess {Object} data.service Thông tin dịch vụ đầy đủ
 * @apiSuccess {String} data.service.name Tên dịch vụ
 * @apiSuccess {String} data.service.description Mô tả dịch vụ
 * @apiSuccess {Number} data.service.base_price Giá cơ bản
 * @apiSuccess {Number} data.service.duration_minutes Thời gian thực hiện (phút)
 * @apiSuccess {Object} [data.cleaner] Thông tin nhân viên đầy đủ (null nếu chưa gán)
 * @apiSuccess {Number} data.cleaner.id ID nhân viên
 * @apiSuccess {String} data.cleaner.name Tên nhân viên
 * @apiSuccess {String} data.cleaner.phone Số điện thoại
 * @apiSuccess {String} data.cleaner.status Trạng thái nhân viên
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "id": 15,
 *         "customer_id": 3,
 *         "service_id": 1,
 *         "cleaner_id": 5,
 *         "start_time": "2024-12-15T09:00:00.000Z",
 *         "end_time": "2024-12-15T11:00:00.000Z",
 *         "location": "123 Le Loi Street, District 1, HCMC",
 *         "status": "CONFIRMED",
 *         "total_price": 400000,
 *         "note": "Please focus on the kitchen area",
 *         "booking_data": {
 *           "name": "Nguyen Van A",
 *           "address": "123 Le Loi Street, District 1, HCMC",
 *           "phone": "0901234567",
 *           "subservice_id": "2br"
 *         },
 *         "cancel_reason": null,
 *         "created_at": "2024-12-01T10:30:00.000Z",
 *         "service": {
 *           "id": 1,
 *           "name": "Home Cleaning",
 *           "description": "Home cleaning service",
 *           "base_price": 150000,
 *           "duration_minutes": 120,
 *           "is_active": true
 *         },
 *         "cleaner": {
 *           "id": 5,
 *           "name": "Le Van C",
 *           "phone": "0909123456",
 *           "status": "ACTIVE"
 *         }
 *       }
 *     }
 *
 * @apiError (401) Unauthorized Token không hợp lệ hoặc đã hết hạn
 * @apiError (404) NotFound Booking không tồn tại hoặc không thuộc về khách hàng này
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Not Found:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Booking not found"
 *     }
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token không hợp lệ"
 *     }
 */
router.get('/:id', authenticate, bookingController.getBookingDetail);

/**
 * @api {PUT} /api/bookings/:id/cancel Cancel Booking
 * @apiVersion 1.0.0
 * @apiName CancelBooking
 * @apiGroup Bookings
 * @apiPermission Customer (JWT Token Required)
 *
 * @apiDescription Hủy một booking. Chỉ có thể hủy booking có trạng thái PENDING hoặc CONFIRMED. Booking phải được hủy trước ít nhất 2 tiếng so với thời gian bắt đầu dịch vụ. Không thể hủy booking đã COMPLETED, CANCELLED.
 *
 * @apiHeader {String} Authorization JWT token với format: Bearer {token}
 *
 * @apiParam {Number} id ID của booking cần hủy
 *
 * @apiBody {String} [cancel_reason] Lý do hủy booking (optional, max 500 ký tự)
 *
 * @apiExample {curl} Example - Cancel without reason:
 * curl -i -X PUT https://hello-node-render.onrender.com/api/bookings/15/cancel \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json"
 *
 * @apiExample {curl} Example - Cancel with reason:
 * curl -i -X PUT https://hello-node-render.onrender.com/api/bookings/15/cancel \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "cancel_reason": "Có việc đột xuất không thể sắp xếp được"
 *   }'
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (true)
 * @apiSuccess {String} message Thông báo kết quả
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Đã hủy thành công"
 *     }
 *
 * @apiError (400) CannotCancel Không thể hủy booking ở trạng thái này
 * @apiError (400) CancelDeadlinePassed Đã quá hạn hủy booking (phải hủy trước 2 tiếng)
 * @apiError (401) Unauthorized Token không hợp lệ hoặc đã hết hạn
 * @apiError (404) NotFound Booking không tồn tại hoặc không thuộc về khách hàng này
 * @apiError (500) InternalServerError Lỗi server
 *
 * @apiErrorExample Cannot Cancel:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Không thể hủy đơn này."
 *     }
 *
 * @apiErrorExample Cancel Deadline Passed:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Quá hạn hủy đơn."
 *     }
 *
 * @apiErrorExample Not Found:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Not found"
 *     }
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "success": false,
 *       "message": "Token không hợp lệ"
 *     }
 */
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;