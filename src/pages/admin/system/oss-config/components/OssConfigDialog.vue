<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { OssConfigForm } from "@/common/apis/admin/system/ossConfig/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { addSysOssConfigApi, updateSysOssConfigApi } from "@/common/apis/admin/system/ossConfig"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

const protocol = computed(() => (formData.value.isHttps === "Y" ? "https://" : "http://"))
const { sys_yes_no } = toRefs<any>(useDict("sys_yes_no"))

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<OssConfigForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  getTableData: []
}
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<OssConfigForm> = {
  configKey: [{ required: true, message: "configKey不能为空", trigger: "blur" }],
  accessKey: [
    { required: true, message: "accessKey不能为空", trigger: "blur" },
    {
      min: 2,
      max: 200,
      message: "accessKey长度必须介于 2 和 100 之间",
      trigger: "blur"
    }
  ],
  secretKey: [
    { required: true, message: "secretKey不能为空", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "secretKey长度必须介于 2 和 100 之间",
      trigger: "blur"
    }
  ],
  bucketName: [
    { required: true, message: "bucketName不能为空", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "bucketName长度必须介于 2 和 100 之间",
      trigger: "blur"
    }
  ],
  endpoint: [
    { required: true, message: "endpoint不能为空", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "endpoint名称长度必须介于 2 和 100 之间",
      trigger: "blur"
    }
  ],
  accessPolicy: [{ required: true, message: "accessPolicy不能为空", trigger: "blur" }]
}

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        dialog.value.loading = true
        const isCreating = formData.value.ossConfigId === undefined
        if (isCreating) {
          const res = await addSysOssConfigApi(formData.value as OssConfigForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysOssConfigApi(formData.value as OssConfigForm)
          ElMessage.success(res.msg)
        }
      } finally {
        // 新增/修改操作后刷新表格
        await getTableData()
        dialog.value.visible = false
        dialog.value.loading = false
      }
    }
  })
}

/**
 * 重置表单
 */
function resetForm() {
  formRef.value?.clearValidate()
  formRef.value?.resetFields()
  formData.value = cloneDeep({})
}
</script>

<template>
  <el-drawer
    v-model="dialog.visible"
    :title="dialog.title"
    direction="rtl"
    :size="isMobile ? '90%' : '40%'"
    @closed="resetForm"
    class="system-drawer"
    modal-class="system-drawer-modal"
    :lock-scroll="true"
    destroy-on-close
  >
    <template #header="{ titleId, titleClass }">
      <div :id="titleId" :class="titleClass" class="drawer-header">
        <span>{{ dialog.title }}</span>
      </div>
    </template>
    <div class="drawer-content">
      <el-form ref="formRef" v-loading="dialog.loading" label-width="auto" :model="formData" :rules="formRules" label-position="left">
        <el-form-item prop="configKey" label="配置key">
          <el-input v-model="formData.configKey" placeholder="请输入配置key" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="endpoint" label="访问站点">
          <el-input v-model="formData.endpoint" placeholder="请输入访问站点" :disabled="!dialog.isEditable">
            <template #prefix>
              <span style="color: #999">{{ protocol }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="domain" label="自定义域名">
          <el-input v-model="formData.domain" placeholder="请输入自定义域名" :disabled="!dialog.isEditable">
            <template #prefix>
              <span style="color: #999">{{ protocol }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="accessKey" label="accessKey">
          <el-input v-model="formData.accessKey" type="textarea" placeholder="请输入accessKey" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="secretKey" label="secretKey">
          <el-input v-model="formData.secretKey" type="textarea" placeholder="请输入秘钥" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="bucketName" label="桶名称">
          <el-input v-model="formData.bucketName" type="textarea" placeholder="请输入桶名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="prefix" label="前缀">
          <el-input v-model="formData.prefix" type="textarea" placeholder="请输入前缀" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="isHttps" label="是否HTTPS">
          <el-radio-group v-model="formData.isHttps" :disabled="!dialog.isEditable">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="remark" label="桶权限类型">
          <el-radio-group v-model="formData.accessPolicy" :disabled="!dialog.isEditable">
            <el-radio value="0">
              private
            </el-radio>
            <el-radio value="1">
              public
            </el-radio>
            <el-radio value="2">
              custom
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="region" label="域">
          <el-input v-model="formData.region" type="textarea" placeholder="请输入域" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!dialog.isEditable" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="drawer-footer">
        <el-button class="btn-cancel" @click="dialog.visible = false">
          取消
        </el-button>
        <el-button class="btn-submit" type="primary" @click="handleCreateOrUpdate" :loading="dialog.loading" :disabled="!dialog.isEditable">
          确认
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
</style>
