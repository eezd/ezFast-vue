<script lang="ts" setup>
import type { ClientForm } from "@@/apis/admin/system/client/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysClientApi, updateSysClientApi } from "@@/apis/admin/system/client"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<ClientForm>>(
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

const { sys_grant_type, sys_device_type, sys_normal_disable } = toRefs<any>(useDict("sys_grant_type", "sys_device_type", "sys_normal_disable"))

const title = computed(() => {
  if (!isEditable.value) return "查看客户端管理"
  return formData.value.id === undefined ? "新增客户端管理" : "编辑客户端管理"
})

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<ClientForm> = {
  clientId: [{ required: true, message: "客户端id不能为空", trigger: "blur" }],
  clientKey: [{ required: true, message: "客户端key不能为空", trigger: "blur" }],
  clientSecret: [{ required: true, message: "客户端秘钥不能为空", trigger: "blur" }],
  grantTypeList: [{ required: true, message: "授权类型不能为空", trigger: "change" }],
  deviceType: [{ required: true, message: "设备类型不能为空", trigger: "change" }]
}

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        loading.value = true
        const isCreating = formData.value.id === undefined
        if (isCreating) {
          const res = await addSysClientApi(formData.value as ClientForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysClientApi(formData.value as ClientForm)
          ElMessage.success(res.msg)
        }
      } finally {
        // 新增/修改操作后刷新表格
        await getTableData()
        dialogVisible.value = false
        loading.value = false
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
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '40%'">
    <el-form ref="formRef" v-loading="loading" label-width="120px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="clientKey" label="客户端key">
        <el-input v-model="formData.clientKey" placeholder="请输入客户端key" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="clientSecret" label="客户端秘钥">
        <el-input v-model="formData.clientSecret" placeholder="请输入客户端秘钥" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="grantTypeList" label="客户端管理键值">
        <el-select v-model="formData.grantTypeList" multiple placeholder="请输入授权类型">
          <el-option v-for="dict in sys_grant_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item prop="deviceType" label="设备类型">
        <el-select v-model="formData.deviceType" placeholder="请输入设备类型">
          <el-option v-for="dict in sys_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>

      <el-form-item prop="activeTimeout" label-width="auto">
        <template #label>
          <span>
            <el-tooltip content="指定时间无操作则过期（单位：秒），默认30分钟（1800秒）" placement="top">
              <el-icon><question-filled /></el-icon>
            </el-tooltip>
            Token活跃超时时间
          </span>
        </template>
        <el-input v-model="formData.activeTimeout" placeholder="请输入Token活跃超时时间" />
      </el-form-item>
      <el-form-item prop="timeout" label-width="auto">
        <template #label>
          <span>
            <el-tooltip content="指定时间必定过期（单位：秒），默认七天（604800秒）" placement="top">
              <el-icon><question-filled /></el-icon>
            </el-tooltip>
            Token固定超时时间
          </span>
        </template>
        <el-input v-model="formData.timeout" placeholder="请输入Token固定超时时间" />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="formData.status">
          <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleCreateOrUpdate" :loading="loading" :disabled="!isEditable">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
