<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { MenuForm, MenuQuery, MenuVO } from "@/common/apis/admin/menu/types"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { delSysMenuApi, getSysMenuListApi } from "@/common/apis/admin/menu"
import { handleTree } from "@/common/utils"
import { download } from "@/common/utils/test"
import DictDataDialog from "./components/MenuDialog.vue"
import DictTable from "./components/MenuTable.vue"

defineOptions({
  name: "AdminSysMenu"
})

export interface MenuOptionsType {
  menuId: number
  menuName: string
  children: MenuOptionsType[] | undefined
}

const loading = ref(false)

const menuTableRef = ref<ElTableInstance | null>(null)

// 表格数据
const tableData = ref<MenuVO[]>([])
const menuChildrenListMap = ref<any>({})
const menuExpandMap = ref<any>({})
const menuOptions = ref<MenuOptionsType[]>([])

// 表单数据
const formData = ref<Partial<MenuForm>>(cloneDeep({}))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isDataDialogEditable = ref<boolean>(true)

// #region 搜索栏
const searchData = reactive({
  menuName: "",
  status: ""
} as MenuQuery)
const searchFormRef = ref<FormInstance | null>(null)

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const res = await getSysMenuListApi(searchData)

    const tempMap = {} as any
    // 存储 父菜单:子菜单列表
    for (const menu of res.data) {
      const parentId = menu.parentId
      if (!tempMap[parentId]) {
        tempMap[parentId] = []
      }
      tempMap[parentId].push(menu)
    }
    // 创建一个当前所有 menuId 的 Set，用于查找父菜单是否存在于当前数据中
    const menuIdSet = new Set()
    // 设置有没有子菜单
    for (const menu of res.data as any) {
      menu.hasChildren = tempMap[menu.menuId]?.length > 0
      menuIdSet.add(menu.menuId)
    }
    menuChildrenListMap.value = tempMap
    // 找出所有父ID不在当前菜单ID集合中的菜单项，作为新的顶层菜单
    tableData.value = res.data.filter(menu => !menuIdSet.has(menu.parentId))
    // 根据新数据重新加载子菜单数据
    refreshAllExpandMenuData()

    await getTreeselect()
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}
/** 获取子菜单列表 */
async function getChildrenList(row: any, treeNode: unknown, resolve: (data: any[]) => void) {
  menuExpandMap.value[row.menuId] = { row, treeNode, resolve }
  const children = menuChildrenListMap.value[row.menuId] || []
  // 菜单的子菜单清空后关闭展开
  if (children.length === 0) {
    // fix: 处理当菜单只有一个子菜单并被删除，需要将父菜单的展开状态关闭
    menuTableRef.value?.updateKeyChildren(row.menuId, children)
  }
  resolve(children)
}
/** 收起菜单时从menuExpandMap中删除对应菜单id数据 */
async function expandMenuHandle(row: any, expanded: boolean) {
  if (!expanded) {
    menuExpandMap.value[row.menuId] = undefined
  }
}

/** 刷新展开的菜单数据 */
function refreshLoadTree(parentId: string | number) {
  if (menuExpandMap.value[parentId]) {
    const { row, treeNode, resolve } = menuExpandMap.value[parentId]
    if (row) {
      getChildrenList(row, treeNode, resolve)
      if (row.parentId) {
        const grandpaMenu = menuExpandMap.value[row.parentId]
        getChildrenList(grandpaMenu.row, grandpaMenu.treeNode, grandpaMenu.resolve)
      }
    }
  }
}
/** 重新加载所有已展开的菜单的数据 */
function refreshAllExpandMenuData() {
  for (const menuId in menuExpandMap.value) {
    refreshLoadTree(menuId)
  }
}

/** 查询菜单下拉树结构 */
async function getTreeselect() {
  menuOptions.value = []
  const response = await getSysMenuListApi()
  const menu: MenuOptionsType = { menuId: 0, menuName: "主类目", children: [] }
  menu.children = handleTree<MenuOptionsType>(response.data, "menuId")
  menuOptions.value.push(menu)
}

/**
 * 删除
 */
async function handleDelete(row: MenuForm) {
  if (!row.menuId) {
    ElMessage.error("id为空")
  }
  const message = `正在删除：${row.menuName}，确认删除？`
  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysMenuApi(row.menuId as any)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/**
 * 导出
 */
function handleExport() {
  const timestamp = new Date().getTime()
  download(
    "/system/dict/type/export",
    { ...searchData },
    `dict_${timestamp}.xlsx`
  )
}

/**
 * 打开添加弹窗
 */
function openAddDialog() {
  formData.value = cloneDeep({})
  isDataDialogEditable.value = true
  dataDialogVisible.value = true
}

/**
 * 打开修改弹窗
 *
 * @param row
 */
function openUpdateDialog(row: MenuForm) {
  formData.value = cloneDeep(row)
  isDataDialogEditable.value = true
  dataDialogVisible.value = true
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
function openShowDialog(row: MenuForm) {
  formData.value = cloneDeep(row)
  isDataDialogEditable.value = false
  dataDialogVisible.value = true
}
// #endregion

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="menuName" label="菜单名称">
          <el-input v-model="searchData.menuName" placeholder="请输入菜单名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-input v-model="searchData.status" placeholder="请输入菜单状态" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="getTableData">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <DictTable
      v-model:menu-table-ref="menuTableRef"
      v-model:loading="loading"
      v-model:table-data="tableData"
      @open-add-dialog="openAddDialog"
      @get-table-data="getTableData"
      @get-children-list="getChildrenList"
      @expand-menu-handle="expandMenuHandle"
      @handle-delete="handleDelete"
      @handle-export="handleExport"
    >
      <template #operation="{ scope }">
        <div style="display: flex; align-items: center; gap: 10px">
          <el-button
            type="primary"
            :icon="Search"
            text
            bg
            size="small"
            @click="openShowDialog(scope.row)"
          >
            查看
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openUpdateDialog(scope.row)">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)">
                  <el-icon color="#F56C6C">
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </DictTable>

    <!-- 数据弹窗 -->
    <DictDataDialog
      v-model:loading="loading"
      v-model:data-dialog-visible="dataDialogVisible"
      v-model:is-editable="isDataDialogEditable"
      v-model:form-data="formData"
      v-model:menu-options="menuOptions"
      @get-table-data="getTableData"
    />
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}
</style>
