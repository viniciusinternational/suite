// src/hooks/useDepartmentUnits.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";

export function useDepartmentUnits() {
  const queryClient = useQueryClient();

  const addUnit = useMutation({
    mutationFn: ({
      departmentId,
      unit,
    }: {
      departmentId: string;
      unit: any;
    }) => api.post(`/departments/${departmentId}`, unit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const deleteUnit = useMutation({
    mutationFn: ({
      departmentId,
      unitId,
    }: {
      departmentId: string;
      unitId: string;
    }) =>
      api.delete(`/departments/${departmentId}/units/${unitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  return { addUnit, deleteUnit };
}
