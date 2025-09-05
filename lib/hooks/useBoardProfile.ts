import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

interface BoardProfile {
  logo_url: string | null;
  // Add other board profile properties if known and needed
}

const fetchBoardProfile = async (): Promise<BoardProfile> => {
  const { data, error } = await supabase
    .from('board_profile')
    .select('logo_url') // Select only logo_url for now, can expand later
    .eq('id', 'MAIN_PROFILE')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Board profile not found.');
  }

  return data as BoardProfile;
};

export const useBoardProfile = () => {
  return useQuery<BoardProfile, Error>({
    queryKey: ['boardProfile'],
    queryFn: fetchBoardProfile,
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    cacheTime: 1000 * 60 * 60, // Data kept in cache for 1 hour
    // Add retry, refetchOnWindowFocus, etc. as needed
  });
};
