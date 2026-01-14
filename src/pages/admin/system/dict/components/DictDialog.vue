<script lang="ts" setup>
import type { DictTypeForm } from "@@/apis/admin/system/dict/type/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysDictTypeApi, updateSysDictTypeApi } from "@@/apis/admin/system/dict/type"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<DictTypeForm>>(
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

const formRules: FormRules<DictTypeForm> = {
  dictName: [
    {
      required: true,
      trigger: "blur",
      message: "字典名称必填"
    }
  ],
  dictType: [
    {
      required: true,
      trigger: "blur",
      message: "字典类型必填"
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
        const isCreating = formData.value.dictId === undefined
        if (isCreating) {
          const res = await addSysDictTypeApi(formData.value as DictTypeForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysDictTypeApi(formData.value as DictTypeForm)
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
        <el-form-item prop="dictName" label="字典名称">
          <el-input v-model="formData.dictName" placeholder="请输入字典名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="dictType" label="字典类型">
          <el-input v-model="formData.dictType" placeholder="请输入字典类型" :disabled="!dialog.isEditable" />
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
