import "server-only";
import { mockApi } from "@/lib/mock/api";
import type { TomurcukApi } from "./contract";

/** Kullanılan uygulama. Spring Boot API'ye geçerken yalnızca bu satır değişir. */
export const impl: TomurcukApi = mockApi;
