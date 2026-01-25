<script setup lang="ts">
import type { OssVO } from "@/common/apis/admin/system/oss/types"
import { compressAccurately } from "image-conversion"
import { delSysOssApi, getSysOssByIdsApi } from "@/common/apis/admin/system/oss"
import propTypes from "@/common/utils/propTypes"
import { globalHeaders } from "@/http/axios"

// ==================== 组件属性定义 ====================
const props = defineProps({
  /**
   * v-model 绑定值
   * 支持三种类型：
   * - String: 逗号分隔的 ossId 字符串，如 "id1,id2,id3"
   * - Object: 单个 OSS 对象
   * - Array: OSS 对象数组
   */
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  /** 图片数量上限，默认 5 张 */
  limit: propTypes.number.def(5),
  /** 文件大小限制（MB），默认 5MB */
  fileSize: propTypes.number.def(5),
  /** 允许的文件类型，如 ['png', 'jpg', 'jpeg'] */
  fileType: propTypes.array.def(["png", "jpg", "jpeg"]),
  /** 是否显示上传提示信息，默认显示 */
  isShowTip: {
    type: Boolean,
    default: true
  },
  /** 是否启用图片压缩功能，默认关闭 */
  compressSupport: {
    type: Boolean,
    default: false
  },
  /**
   * 图片压缩目标大小（KB）
   * 超过此大小的图片会被压缩到此大小以内
   * 默认 300KB
   */
  compressTargetSize: propTypes.number.def(300)
})

// ==================== 事件定义 ====================
const emit = defineEmits(["update:modelValue"])

// ==================== 响应式数据 ====================
/** 当前正在上传的文件数量计数器 */
const number = ref(0)
/** 临时存储上传成功的文件列表 */
const uploadList = ref<any[]>([])
/** 预览对话框中显示的图片 URL */
const dialogImageUrl = ref("")
/** 控制预览对话框的显示/隐藏 */
const dialogVisible = ref(false)
/** Element Plus Upload 组件实例引用 */
const imageUploadRef = ref<ElUploadInstance>()
/** 展示的文件列表（包含 name, url, ossId） */
const fileList = ref<any[]>([])

// ==================== 计算属性 ====================
/** 上传服务器地址 */
const baseUrl = import.meta.env.VITE_BASE_URL
const uploadImgUrl = ref(`${baseUrl}/resource/oss/upload`)

/** 请求头配置 */
const headers = ref(globalHeaders())

/**
 * 是否显示上传提示
 * 需要 isShowTip 为 true 且配置了 fileType 或 fileSize 时才显示
 */
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))

/**
 * 根据 fileType 生成 accept 属性值
 * 例如：['png', 'jpg'] => '.png,.jpg'
 */
const fileAccept = computed(() => props.fileType.map(type => `.${type}`).join(","))

// ==================== Loading 实例管理 ====================
/** Element Plus Loading 实例，用于显示上传进度 */
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

// ==================== 监听器 ====================
/**
 * 监听 modelValue 变化，处理文件回显
 * 支持三种数据格式的回显：
 * 1. 数组格式：直接使用
 * 2. 字符串格式（ossId）：调用接口查询文件信息
 * 3. 空值：清空文件列表
 */
watch(
  () => props.modelValue,
  async (val: any) => {
    if (val) {
      let list: OssVO[] = []

      // 判断是数组还是字符串（ossId）
      if (Array.isArray(val)) {
        list = val as OssVO[]
      } else {
        // 根据 ossId 字符串查询文件信息
        const res = await getSysOssByIdsApi(val)
        list = res.data
      }

      // 将数据转换为 el-upload 需要的格式
      fileList.value = list.map((item) => {
        if (typeof item === "string") {
          // 字符串类型（URL）
          return { name: item, url: item }
        } else {
          // 对象类型（包含 ossId）
          // 使用 ossId 作为 name 避免删除时重名问题
          return {
            name: item.ossId,
            url: item.url,
            ossId: item.ossId
          }
        }
      })
    } else {
      // 清空文件列表
      fileList.value = []
    }
  },
  { deep: true, immediate: true }
)

// ==================== 上传前处理 ====================
// eslint-disable-next-line jsdoc/require-returns-check
/**
 * 文件上传前的验证和处理
 * @param file 待上传的文件对象
 * @returns {boolean|Promise} 返回 false 则阻止上传，返回 Promise 则用压缩后的文件
 */
function handleBeforeUpload(file: any) {
  // 1️⃣ 验证文件类型
  let isImg = false
  if (props.fileType.length) {
    // 提取文件扩展名
    let fileExtension = ""
    if (file.name.includes(".")) {
      const dotIndex = file.name.lastIndexOf(".")
      fileExtension = file.name.slice(dotIndex + 1)
    }

    // 检查文件类型是否在允许的范围内
    isImg = props.fileType.some((type: any) => {
      // 通过 MIME 类型检查
      if (file.type?.includes(type)) return true
      // 通过文件扩展名检查
      if (fileExtension && fileExtension.includes(type)) return true
      return false
    })
  } else {
    // 未指定类型时，只检查是否为图片
    isImg = file.type?.includes("image")
  }

  if (!isImg) {
    ElMessage.error(`文件格式不正确, 请上传 ${props.fileType.join("/")} 图片格式文件!`)
    return false
  }

  // 2️⃣ 验证文件名（不能包含逗号，避免与分隔符冲突）
  if (file.name.includes(",")) {
    ElMessage.error("文件名不正确，不能包含英文逗号!")
    return false
  }

  // 3️⃣ 验证文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      ElMessage.error(`上传图片大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }

  // 4️⃣ 图片压缩处理
  // 当开启压缩且文件大小超过压缩阈值时进行压缩
  if (props.compressSupport && file.size / 1024 > props.compressTargetSize) {
    loadingInstance?.close()
    loadingInstance = ElLoading.service({ text: "正在上传图片，请稍候..." })
    number.value++
    // 返回压缩后的文件 Promise
    return compressAccurately(file, props.compressTargetSize)
  } else {
    // 不需要压缩，直接上传
    loadingInstance?.close()
    loadingInstance = ElLoading.service({ text: "正在上传图片，请稍候..." })
    number.value++
  }
}

// ==================== 文件数量超限处理 ====================
/**
 * 当文件数量超过限制时触发
 */
function handleExceed() {
  ElMessage.error(`上传文件数量不能超过 ${props.limit} 个!`)
}

// ==================== 上传成功回调 ====================
/**
 * 文件上传成功后的处理
 * @param res 服务器返回的响应数据
 * @param file 上传的文件对象
 */
function handleUploadSuccess(res: any, file: UploadFile) {
  if (res.code === 200) {
    // 上传成功，将文件信息添加到临时列表
    uploadList.value.push({
      name: res.data.fileName,
      url: res.data.url,
      ossId: res.data.ossId
    })
    uploadedSuccessfully()
  } else {
    // 上传失败，回滚计数器并移除文件
    number.value--
    loadingInstance?.close()
    ElMessage.error(res.msg)
    imageUploadRef.value?.handleRemove(file)
    uploadedSuccessfully()
  }
}

// ==================== 删除文件处理 ====================
/**
 * 删除文件前的处理
 * @param file 要删除的文件对象
 * @returns {boolean} 返回 false 阻止默认删除行为
 */
function handleDelete(file: UploadFile): boolean {
  // 在文件列表中查找要删除的文件索引
  const findex = fileList.value.map(f => f.name).indexOf(file.name)

  // 如果文件存在且所有上传已完成
  if (findex > -1 && uploadList.value.length === number.value) {
    const ossId = fileList.value[findex].ossId
    // 调用接口删除服务器上的文件
    delSysOssApi(ossId)
    // 从文件列表中移除
    fileList.value.splice(findex, 1)
    // 触发 v-model 更新
    emit("update:modelValue", listToString(fileList.value))
    return false // 阻止 el-upload 的默认删除行为
  }
  return true // 允许默认删除行为
}

// ==================== 上传完成处理 ====================
/**
 * 检查所有文件是否上传完成
 * 完成后合并文件列表并触发 v-model 更新
 */
function uploadedSuccessfully() {
  // 当所有待上传文件都已处理完成
  if (number.value > 0 && uploadList.value.length === number.value) {
    // 合并现有文件列表和新上传的文件列表
    fileList.value = fileList.value
      .filter(f => f.url !== undefined) // 过滤掉无效文件
      .concat(uploadList.value) // 合并新上传的文件

    // 重置临时数据
    uploadList.value = []
    number.value = 0

    // 触发 v-model 更新，传递 ossId 字符串
    emit("update:modelValue", listToString(fileList.value))

    // 关闭 loading
    loadingInstance?.close()
  }
}

// ==================== 上传失败处理 ====================
/**
 * 文件上传失败的处理
 */
function handleUploadError() {
  ElMessage.error("上传图片失败")
  loadingInstance?.close()
}

// ==================== 图片预览 ====================
/**
 * 点击图片预览
 * @param file 要预览的文件对象
 */
function handlePictureCardPreview(file: any) {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}

// ==================== 工具函数 ====================
/**
 * 将文件列表转换为以分隔符连接的 ossId 字符串
 * @param list 文件对象数组
 * @param separator 分隔符，默认为逗号
 * @returns {string} ossId 字符串，如 "id1,id2,id3"
 */
function listToString(list: any[], separator?: string): string {
  let strs = ""
  separator = separator || ","

  for (const i in list) {
    // 只处理有效的 ossId（非 undefined 且非 blob URL）
    if (undefined !== list[i].ossId && list[i].url.indexOf("blob:") !== 0) {
      strs += list[i].ossId + separator
    }
  }

  // 移除末尾多余的分隔符
  return strs !== "" ? strs.substring(0, strs.length - 1) : ""
}
</script>

<template>
  <div class="component-upload-image">
    <!-- 图片上传组件 -->
    <el-upload
      ref="imageUploadRef"
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
      :on-preview="handlePictureCardPreview"
      :class="{ hide: fileList.length >= limit }"
    >
      <!-- 上传按钮（加号图标） -->
      <el-icon class="avatar-uploader-icon">
        <plus />
      </el-icon>
    </el-upload>

    <!-- 上传提示信息 -->
    <div v-if="showTip" class="el-upload__tip">
      请上传
      <template v-if="fileSize">
        大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
      </template>
      的文件
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="预览"
      width="800px"
      append-to-body
    >
      <img
        :src="dialogImageUrl"
        style="display: block; max-width: 100%; margin: 0 auto"
        alt="预览图片"
      >
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
/**
 * 当文件数量达到上限时隐藏上传按钮
 * .hide 类会在 :class 绑定中动态添加
 */
:deep(.hide .el-upload--picture-card) {
  display: none;
}
</style>
