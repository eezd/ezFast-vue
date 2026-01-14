<script lang="ts" setup>
import type { MenuForm } from "@@/apis/admin/system/menu/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import type { MenuOptionsType } from "../index.vue"
import { addSysMenuApi, updateSysMenuApi } from "@@/apis/admin/system/menu"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<MenuForm>>(
  "formData",
  {
    required: true
  }
)
const menuOptions = defineModel<MenuOptionsType[]>(
  "menuOptions",
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

const { sys_show_hide, sys_normal_disable } = toRefs<any>(useDict("sys_show_hide", "sys_normal_disable"))

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<any> = {
  menuName: [
    {
      required: true,
      trigger: "blur",
      message: "菜单名称必填"
    }
  ],
  orderNum: [
    {
      required: true,
      trigger: "blur",
      message: "菜单顺序必填"
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
        const isCreating = formData.value.menuId === undefined
        if (isCreating) {
          const res = await addSysMenuApi(formData.value as any)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysMenuApi(formData.value as any)
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
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级菜单">
              <el-tree-select
                v-model="formData.parentId"
                :data="menuOptions"
                :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                value-key="menuId"
                placeholder="选择上级菜单"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="formData.menuType">
                <el-radio value="M">
                  目录
                </el-radio>
                <el-radio value="C">
                  菜单
                </el-radio>
                <el-radio value="F">
                  按钮
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="formData.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.menuType !== 'M'" :span="isMobile ? 24 : 12">
            <el-form-item>
              <el-input v-model="formData.perms" placeholder="请输入权限标识" maxlength="100" />
              <template #label>
                <span>
                  <el-tooltip content="控制器中定义的权限字符，如：@SaCheckPermission('system:user:list')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>
                  权限字符
                </span>
              </template>
            </el-form-item>
          </el-col>
          <el-col v-if="formData.menuType !== 'F'" :span="isMobile ? 24 : 12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>
                  显示状态
                </span>
              </template>
              <el-radio-group v-model="formData.visible">
                <el-radio v-for="dict in sys_show_hide" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>
                  菜单状态
                </span>
              </template>
              <el-radio-group v-model="formData.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
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
