/**
 * Dynamic Block Schemas - MATCHING SQL DATA STRUCTURE
 * File: src/config/blockSchemas.js
 */

// 1. Định nghĩa các loại Block (Constants)
const BLOCK_TYPES = {
  INTRO: 'intro',
  DEFINITION: 'definition',
  PRICING: 'pricing',
  TASK_TAB: 'task_tab',
  PROCESS: 'process',
  BOOKING: 'booking'
};

// 2. Schema chi tiết cho từng Block (Backend Validation)
const BLOCK_SCHEMAS = {
  // --- Block 1: Intro Section ---
  // SQL Data: { title, banner_image_url }
  [BLOCK_TYPES.INTRO]: {
    type: BLOCK_TYPES.INTRO,
    name: 'Giới thiệu',
    description: 'Banner giới thiệu đầu trang',
    fields: {
      title: { // SỬA: heading -> title
        type: 'text',
        label: 'Tiêu đề (H1)',
        required: true
      },
      banner_image_url: { // SỬA: image_url -> banner_image_url
        type: 'image',
        label: 'Ảnh nền Banner',
        required: true
      }
    },
    defaultData: {
      title: 'Dịch vụ dọn nhà',
      banner_image_url: ''
    }
  },

  // --- Block 2: Definition ---
  // SQL Data: { title, content }
  [BLOCK_TYPES.DEFINITION]: {
    type: BLOCK_TYPES.DEFINITION,
    name: 'Mô tả / Lợi ích',
    description: 'Đoạn văn bản giới thiệu chi tiết',
    fields: {
      title: { // SỬA: heading -> title
        type: 'text',
        label: 'Tiêu đề mục',
        required: true
      },
      content: { // SỬA: items -> content (Theo cấu trúc FE bạn gửi trước đó)
        type: 'richtext',
        label: 'Nội dung (HTML)',
        required: true
      }
    },
    defaultData: {
      title: 'Về dịch vụ',
      content: '<p>Mô tả chi tiết...</p>'
    }
  },

  // --- Block 3: Pricing Table ---
  // SQL Data: { service_title, note, subservices: [{ id, subservice_title, price }] }
  [BLOCK_TYPES.PRICING]: {
    type: BLOCK_TYPES.PRICING,
    name: 'Bảng giá',
    description: 'Hiển thị bảng giá dịch vụ',
    fields: {
      service_title: {
        type: 'text',
        label: 'Tên bảng giá',
        required: true
      },
      note: {
        type: 'textarea',
        label: 'Ghi chú chung',
        required: false
      },
      subservices: {
        type: 'array',
        label: 'Danh sách gói dịch vụ',
        required: true,
        minItems: 1,
        itemSchema: {
          id: { type: 'text', label: 'Mã gói (ID)', required: true },
          subservice_title: { type: 'text', label: 'Tên gói', required: true }, // SỬA: subservice_title
          price: { type: 'number', label: 'Giá (VNĐ)', required: true, min: 0 }
        }
      }
    },
    defaultData: {
      service_title: 'Bảng giá dịch vụ',
      subservices: []
    }
  },

  // --- Block 4: Task Tabs ---
  // SQL Data: { title, tabs: [{ tab_title, description, image_url }] }
  [BLOCK_TYPES.TASK_TAB]: {
    type: BLOCK_TYPES.TASK_TAB,
    name: 'Tab công việc',
    description: 'Hiển thị các tab nội dung',
    fields: {
      title: { // SỬA: heading -> title
        type: 'text',
        label: 'Tiêu đề chung',
        required: true
      },
      tabs: {
        type: 'array',
        label: 'Danh sách tabs',
        required: true,
        minItems: 1,
        itemSchema: {
          tab_title: { type: 'text', label: 'Tên tab', required: true }, // SỬA: title -> tab_title
          description: { type: 'richtext', label: 'Nội dung', required: true }, // SỬA: content -> description
          image_url: { type: 'image', label: 'Hình ảnh', required: true }
        }
      }
    },
    defaultData: {
      title: 'Chi tiết công việc',
      tabs: []
    }
  },

  // --- Block 5: Process Timeline ---
  // SQL Data: { title, steps: [{ number, step_title, description, image_url }] }
  [BLOCK_TYPES.PROCESS]: {
    type: BLOCK_TYPES.PROCESS,
    name: 'Quy trình',
    description: 'Hiển thị quy trình từng bước',
    fields: {
      title: { // SỬA: heading -> title
        type: 'text',
        label: 'Tiêu đề quy trình',
        required: true
      },
      steps: {
        type: 'array',
        label: 'Danh sách bước',
        required: true,
        minItems: 1,
        itemSchema: {
          number: { type: 'number', label: 'Số thứ tự', required: true, min: 1 },
          step_title: { type: 'text', label: 'Tên bước', required: true }, // SỬA: title -> step_title
          description: { type: 'textarea', label: 'Mô tả', required: true },
          image_url: { type: 'image', label: 'Hình ảnh', required: true }
        }
      }
    },
    defaultData: {
      title: 'Quy trình làm việc',
      steps: []
    }
  },

  // --- Block 6: Booking Form ---
  // SQL Data: { title, button_text, image_url, form_schema: [...] }
  [BLOCK_TYPES.BOOKING]: {
    type: BLOCK_TYPES.BOOKING,
    name: 'Form đặt lịch',
    description: 'Khối booking với form động',
    fields: {
      title: { // SỬA: heading -> title
        type: 'text',
        label: 'Tiêu đề',
        required: true
      },
      image_url: {
        type: 'image',
        label: 'Hình nền/ảnh',
        required: true
      },
      button_text: {
        type: 'text',
        label: 'Text nút',
        required: false,
        default: 'Đặt ngay'
      },
      form_schema: {
        type: 'array',
        label: 'Cấu hình fields của Form',
        required: true,
        itemSchema: {
          field_name: { type: 'text', label: 'Tên field (DB)', required: true },
          field_type: { 
            type: 'select', 
            label: 'Loại field', 
            required: true,
            options: ['text', 'select', 'date', 'time']
          },
          label: { type: 'text', label: 'Label hiển thị', required: true },
          required: { type: 'boolean', label: 'Bắt buộc?', default: false },
          options: { type: 'array', label: 'Options (cho select)', required: false }
        }
      }
    },
    defaultData: {
      title: 'Đặt lịch ngay',
      image_url: '',
      button_text: 'Đặt ngay',
      form_schema: []
    }
  }
};

/**
 * Validate block data theo schema
 * Hàm này giữ nguyên logic, chỉ cần schema đúng là nó chạy đúng
 */
const validateBlock = (blockType, blockData) => {
  const schema = BLOCK_SCHEMAS[blockType];
  
  if (!schema) {
    return {
      valid: false,
      errors: [`Block type "${blockType}" không tồn tại`]
    };
  }

  const errors = [];

  // Loop qua từng field định nghĩa trong schema
  Object.entries(schema.fields).forEach(([fieldName, fieldConfig]) => {
    const value = blockData[fieldName];

    // 1. Validate Required
    if (fieldConfig.required) {
      const isEmpty = value === undefined || value === null || value === '';
      if (isEmpty && value !== 0 && value !== false) {
        errors.push(`Field "${fieldName}" (${fieldConfig.label || fieldName}) là bắt buộc`);
        return; 
      }
    }

    // 2. Validate Array
    if (fieldConfig.type === 'array') {
      if (value && !Array.isArray(value)) {
        errors.push(`Field "${fieldName}" phải là danh sách (array)`);
        return;
      }

      if (Array.isArray(value)) {
        if (fieldConfig.minItems && value.length < fieldConfig.minItems) {
            errors.push(`Field "${fieldName}" cần tối thiểu ${fieldConfig.minItems} phần tử`);
        }
        if (fieldConfig.maxItems && value.length > fieldConfig.maxItems) {
            errors.push(`Field "${fieldName}" chỉ được tối đa ${fieldConfig.maxItems} phần tử`);
        }

        // Validate từng item bên trong
        if (fieldConfig.itemSchema) {
          value.forEach((item, index) => {
            Object.entries(fieldConfig.itemSchema).forEach(([subFieldName, subFieldConfig]) => {
              const subValue = item[subFieldName];
              
              // Check required sub-field
              if (subFieldConfig.required) {
                const isSubEmpty = subValue === undefined || subValue === null || subValue === '';
                if (isSubEmpty && subValue !== 0 && subValue !== false) {
                  errors.push(`${fieldName}[${index}].${subFieldName} (${subFieldConfig.label}) là bắt buộc`);
                }
              }
              
              // Check Min number
              if (subFieldConfig.type === 'number') {
                 if (typeof subValue === 'number' && subFieldConfig.min !== undefined && subValue < subFieldConfig.min) {
                    errors.push(`${fieldName}[${index}].${subFieldName} phải lớn hơn hoặc bằng ${subFieldConfig.min}`);
                 }
              }
            });
          });
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  BLOCK_TYPES,
  BLOCK_SCHEMAS,
  validateBlock
};