<script lang="ts" setup>
import type { DictTypeForm, DictTypeQuery } from "@/common/apis/admin/dict/type/types"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysDictTypeApi, getSysDictListTypeApi } from "@/common/apis/admin/dict/type"
import { download } from "@/common/utils/test"
import DictDataDialog from "./components/DictDialog.vue"
import DictSearchForm from "./components/DictSearchForm.vue"
import DictTable from "./components/DictTable.vue"

defineOptions({
  name: "AdminSysDict"
})

const loading = ref(false)
// 表格数据
const tableData = ref<DictTypeForm[]>([])
// 表单数据
const formData = ref<Partial<DictTypeForm>>(cloneDeep({}))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isDataDialogEditable = ref<boolean>(true)
// 搜索
const searchData = reactive({
  dictName: "",
  dictType: "",
  params: {
    beginTime: "",
    endTime: ""
  }
} as DictTypeQuery)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const { rows, total } = await getSysDictListTypeApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 删除
 */
async function handleDelete(row: DictTypeForm | DictTypeForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.dictId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.dictName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysDictTypeApi(deleteIds)
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
function openUpdateDialog(row: DictTypeForm) {
  formData.value = cloneDeep(row)
  isDataDialogEditable.value = true
  dataDialogVisible.value = true
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
function openShowDialog(row: DictTypeForm) {
  formData.value = cloneDeep(row)
  isDataDialogEditable.value = false
  dataDialogVisible.value = true
}
// #endregion

// #region 监听
/**
 * 监听分页参数的变化
 */
watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  },
  { immediate: true }
)

/**
 * 弹窗关闭后刷新表格
 */
watch(dataDialogVisible, (visible) => {
  if (!visible) {
    getTableData()
  }
})
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <DictSearchForm v-model:loading="loading" v-model:search-data="searchData" @get-table-data="getTableData" />

    <!-- 表格 -->
    <DictTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
      @handle-delete="handleDelete"
      @handle-export="handleExport"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
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
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
