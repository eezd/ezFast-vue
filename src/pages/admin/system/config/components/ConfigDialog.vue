<script lang="ts" setup>
import type { ConfigForm } from "@@/apis/admin/system/config/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysConfigApi, updateSysConfigApi } from "@@/apis/admin/system/config"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<ConfigForm>>(
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

const { sys_yes_no } = toRefs<any>(useDict("sys_yes_no"))

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<ConfigForm> = {
  configName: [
    {
      required: true,
      trigger: "blur",
      message: "参数名称必填"
    }
  ],
  configKey: [
    {
      required: true,
      trigger: "blur",
      message: "参数键名必填"
    }
  ],
  configValue: [
    {
      required: true,
      trigger: "blur",
      message: "参数键值必填"
    }
  ]
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
        const isCreating = formData.value.configId === undefined
        if (isCreating) {
          const res = await addSysConfigApi(formData.value as ConfigForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysConfigApi(formData.value as ConfigForm)
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
        <el-form-item prop="configName" label="参数名称">
          <el-input v-model="formData.configName" placeholder="请输入参数名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="configKey" label="参数键名">
          <el-input v-model="formData.configKey" placeholder="请输入参数键名" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="configValue" label="参数键值">
          <el-input v-model="formData.configValue" placeholder="请输入参数键值" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="configType" label="系统内置">
          <el-radio-group v-model="formData.configType">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
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
