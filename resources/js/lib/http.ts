import axios from "axios";
export type { AxiosResponse } from "axios";

const http = axios.create({
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

export default http;
