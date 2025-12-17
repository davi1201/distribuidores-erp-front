import api from "@/lib/api";

export const updateMemberRole = async (userId: string, role: string): Promise<any> => {
  const { data } = await api.patch(`/team/update-role/${userId}`, { role });
  return data;
};