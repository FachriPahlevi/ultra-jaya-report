export type Permission = {
    id: number;
    name: string;
    group: string;
    label: string;
    description: string;
};

export type Role = {
    id: number;
    name: string;
    permissions: Permission[];
};

export type AuthUser = {
    id: number;
    roles: string[];
};

export type ApiMessage = {
    message: string;
};
