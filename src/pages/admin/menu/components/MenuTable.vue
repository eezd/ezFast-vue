<script lang="ts" setup>
import type { MenuForm, MenuQuery } from "@/common/apis/admin/menu/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { formatDateTime } from "@@/utils/index"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<MenuForm[]>("tableData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const menuTableRef = defineModel<ElTableInstance | null>("menuTableRef", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleExport: []
  getTableData: [params?: MenuQuery]
  getChildrenList: [row: any, treeNode: unknown, resolve: (data: any[]) => void]
  expandMenuHandle: [row: any, expanded: boolean]
}
const openAddDialog = () => emit("openAddDialog")
const handleExport = () => emit("handleExport")
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const { sys_normal_disable } = toRefs<any>(useDict("sys_show_hide", "sys_normal_disable"))
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          @click="openAddDialog()"
        >
          新增菜单
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          @click="handleExport()"
        >
          导出
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table
        ref="menuTableRef"
        v-loading="loading"
        :data="tableData"
        row-key="menuId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="(row, treeNode, resolve) => emit('getChildrenList', row, treeNode, resolve)"
        :expand-change="(row: any, expanded: boolean) => emit('expandMenuHandle', row, expanded)"
      >
        <el-table-column prop="menuName" label="菜单名称" />
        <el-table-column prop="orderNum" label="排序" align="center" />
        <el-table-column prop="perms" label="权限标识" align="center" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <DictTag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" :width="isMobile ? 100 : 130" align="center">
          <template #default="scope">
            <slot name="operation" :scope="scope" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
