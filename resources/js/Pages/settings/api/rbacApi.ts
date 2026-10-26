import http, { type AxiosResponse } from "@/lib/http"
import type { ApiMessage, Role } from "@/Pages/settings/types"

export type RolePayload = { name: string }

export const createRole = (payload: RolePayload): Promise<AxiosResponse<ApiMessage & { role: Role }>> => http.post("/settings/roles", payload)
export const updateRole = (roleId: number, payload: RolePayload): Promise<AxiosResponse<ApiMessage>> => http.put(`/settings/roles/${roleId}`, payload)
export const deleteRole = (roleId: number): Promise<AxiosResponse<ApiMessage>> => http.delete(`/settings/roles/${roleId}`)
export const syncRolePermissions = (roleId: number, permissions: string[]): Promise<AxiosResponse<ApiMessage>> => http.post(`/settings/roles/${roleId}/permissions`, { permissions })
