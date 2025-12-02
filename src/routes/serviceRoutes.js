const express = require('express');
const router = express.Router();

// 1. Import Controller (Đã gộp)
const serviceController = require('../controllers/serviceController');

// 2. Import Validators
const { idParamValidation, validate } = require('../validators/serviceValidator');

// ============================================
// PUBLIC ROUTES (Ai cũng truy cập được)
// ============================================

/**
 * @api {GET} /api/services Get All Services
 * @apiVersion 1.0.0
 * @apiName GetPublicServices
 * @apiGroup Services
 * @apiPermission public
 *
 * @apiDescription Lấy danh sách tất cả dịch vụ đang hoạt động (is_active = true). 
 * Route này không yêu cầu authentication và chỉ trả về các thông tin cơ bản của service 
 * (không bao gồm layout_config).
 *
 * @apiExample {curl} Example usage:
 * curl -i https://hello-node-render.onrender.com/api/services
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (luôn là true)
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object[]} data.services Danh sách dịch vụ
 * @apiSuccess {Number} data.services.id ID của dịch vụ
 * @apiSuccess {String} data.services.name Tên dịch vụ
 * @apiSuccess {String} data.services.description Mô tả ngắn về dịch vụ
 * @apiSuccess {Number} data.services.base_price Giá cơ bản (VNĐ)
 * @apiSuccess {Number} data.services.duration_minutes Thời gian thực hiện (phút)
 * @apiSuccess {Number} data.total Tổng số dịch vụ
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "services": [
 *           {
 *             "id": 1,
 *             "name": "Home Cleaning",
 *             "description": "Home cleaning service",
 *             "base_price": 150000,
 *             "duration_minutes": 120
 *           },
 *           {
 *             "id": 2,
 *             "name": "Full-package House Moving",
 *             "description": "Fast & Affordable Full-service House Moving",
 *             "base_price": 500000,
 *             "duration_minutes": 300
 *           }
 *         ],
 *         "total": 2
 *       }
 *     }
 *
 * @apiError (Error 5xx) InternalServerError Lỗi server không xác định
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "success": false,
 *       "message": "Internal server error"
 *     }
 */
router.get('/', serviceController.getPublicServices);

/**
 * @api {GET} /api/services/:id Get Service Detail
 * @apiVersion 1.0.0
 * @apiName GetServiceDetail
 * @apiGroup Services
 * @apiPermission public
 *
 * @apiDescription Lấy thông tin chi tiết của 1 dịch vụ, bao gồm cả layout_config 
 * (cấu hình các block hiển thị trên trang dịch vụ). Chỉ trả về dịch vụ đang active.
 *
 * @apiParam {Number} id ID của dịch vụ cần lấy (trong URL params)
 *
 * @apiExample {curl} Example usage:
 * curl -i https://hello-node-render.onrender.com/api/services/1
 *
 * @apiSuccess {Boolean} success Trạng thái thành công (luôn là true)
 * @apiSuccess {Object} data Dữ liệu trả về
 * @apiSuccess {Object} data.service Thông tin dịch vụ
 * @apiSuccess {Number} data.service.id ID của dịch vụ
 * @apiSuccess {String} data.service.name Tên dịch vụ
 * @apiSuccess {String} data.service.description Mô tả dịch vụ
 * @apiSuccess {Number} data.service.base_price Giá cơ bản (VNĐ)
 * @apiSuccess {Number} data.service.duration_minutes Thời gian thực hiện (phút)
 * @apiSuccess {Boolean} data.service.is_active Trạng thái hoạt động
 * @apiSuccess {Object[]} data.service.layout_config Cấu hình layout động (array of blocks)
 * @apiSuccess {String} data.service.layout_config.type Loại block (intro/pricing/task_tab/process/booking/definition)
 * @apiSuccess {Number} data.service.layout_config.order Thứ tự hiển thị
 * @apiSuccess {Object} data.service.layout_config.data Dữ liệu của block (cấu trúc khác nhau theo type)
 * @apiSuccess {String} data.service.created_at Thời gian tạo
 *
 * @apiSuccessExample {json} Success-Response (Home Cleaning Service):
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "service": {
 *           "id": 1,
 *           "name": "Home Cleaning",
 *           "description": "Home cleaning service",
 *           "base_price": 150000,
 *           "duration_minutes": 120,
 *           "is_active": true,
 *           "layout_config": [
 *             {
 *               "type": "intro",
 *               "order": 0,
 *               "data": {
 *                 "title": "Home Cleaning Service",
 *                 "banner_image_url": "https://res.cloudinary.com/..."
 *               }
 *             },
 *             {
 *               "type": "pricing",
 *               "order": 1,
 *               "data": {
 *                 "service_title": "Cleaning Packages",
 *                 "note": "Prices include VAT...",
 *                 "subservices": [
 *                   {
 *                     "id": "2br",
 *                     "subservice_title": "2-Bedroom Apartment",
 *                     "price": 400000
 *                   },
 *                   {
 *                     "id": "3br",
 *                     "subservice_title": "3-Bedroom Apartment",
 *                     "price": 550000
 *                   }
 *                 ]
 *               }
 *             },
 *             {
 *               "type": "task_tab",
 *               "order": 2,
 *               "data": {
 *                 "title": "Detailed Work Items",
 *                 "tabs": [
 *                   {
 *                     "tab_title": "Living Room",
 *                     "image_url": "https://res.cloudinary.com/...",
 *                     "description": "<ul><li>Sweep and mop floors...</li></ul>"
 *                   }
 *                 ]
 *               }
 *             },
 *             {
 *               "type": "booking",
 *               "order": 3,
 *               "data": {
 *                 "title": "Get a Quote",
 *                 "button_text": "Submit Request",
 *                 "image_url": "https://res.cloudinary.com/...",
 *                 "form_schema": [
 *                   {
 *                     "field_name": "name",
 *                     "field_type": "text",
 *                     "label": "Name",
 *                     "required": true
 *                   },
 *                   {
 *                     "field_name": "address",
 *                     "field_type": "text",
 *                     "label": "Address",
 *                     "required": true
 *                   },
 *                   {
 *                     "field_name": "phone",
 *                     "field_type": "text",
 *                     "label": "Phone number",
 *                     "required": true
 *                   },
 *                   {
 *                     "field_name": "subservice_id",
 *                     "field_type": "select",
 *                     "label": "Select Package",
 *                     "required": true,
 *                     "options": ["2 bedroom", "3bedroom"]
 *                   },
 *                   {
 *                     "field_name": "booking_date",
 *                     "field_type": "date",
 *                     "label": "Cleaning Date",
 *                     "required": true
 *                   },
 *                   {
 *                     "field_name": "booking_time",
 *                     "field_type": "time",
 *                     "label": "Cleaning Time",
 *                     "required": true
 *                   }
 *                 ]
 *               }
 *             }
 *           ],
 *           "created_at": "2024-01-15T10:30:00.000Z"
 *         }
 *       }
 *     }
 *
 * @apiError (Error 400) InvalidID ID không hợp lệ (không phải số nguyên)
 * @apiError (Error 404) NotFound Không tìm thấy dịch vụ hoặc dịch vụ không active
 *
 * @apiErrorExample {json} Error-Response (Invalid ID):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "message": "Dữ liệu không hợp lệ",
 *       "errors": [
 *         {
 *           "field": "id",
 *           "message": "ID không hợp lệ"
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample {json} Error-Response (Not Found):
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "message": "Dịch vụ không tồn tại"
 *     }
 */
router.get(
  '/:id',
  idParamValidation,
  validate,
  serviceController.getServiceDetail
);

module.exports = router;