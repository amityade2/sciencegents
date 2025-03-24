
import { supabase } from "@/integrations/supabase/client";
import { DeveloperProfile, SocialLink } from "@/types/profile";
import { Json } from "@/integrations/supabase/types";

/**
 * Fetches a developer profile by wallet address
 * @param walletAddress Ethereum wallet address
 * @returns The developer profile or null if not found
 */
export const fetchDeveloperProfile = async (walletAddress: string): Promise<DeveloperProfile | null> => {
  try {
    if (!walletAddress) return null;
    
    const { data, error } = await supabase
      .from('developer_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        console.log(`No developer profile found for wallet ${walletAddress}`);
        return null;
      }
      console.error("Error fetching developer profile:", error);
      throw error;
    }
    
    // Transform Supabase JSON to typed SocialLink array
    const socialLinks: SocialLink[] = Array.isArray(data.additional_social_links) 
      ? data.additional_social_links.map((link: any) => ({
          type: link.type || '',
          url: link.url || ''
        }))
      : [];
    
    const transformedData: DeveloperProfile = {
      wallet_address: data.wallet_address,
      developer_name: data.developer_name,
      developer_email: data.developer_email,
      bio: data.bio,
      profile_pic: data.profile_pic,
      developer_twitter: data.developer_twitter,
      developer_telegram: data.developer_telegram,
      developer_github: data.developer_github,
      developer_website: data.developer_website,
      additional_social_links: socialLinks,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return transformedData;
  } catch (error) {
    console.error("Error in fetchDeveloperProfile:", error);
    return null;
  }
};

/**
 * Updates or creates a developer profile
 * @param profile Developer profile data
 * @returns The updated profile or null if the operation failed
 */
export const upsertDeveloperProfile = async (profile: DeveloperProfile): Promise<DeveloperProfile | null> => {
  try {
    if (!profile.wallet_address) {
      throw new Error("Wallet address is required");
    }
    
    // Create a deep copy of the profile to avoid modifying the original
    const profileCopy = { ...profile };
    
    // For TypeScript strict typing, we need to properly cast the additional_social_links
    // Convert the SocialLink[] to a format Supabase can accept
    const supabaseData = {
      wallet_address: profileCopy.wallet_address,
      developer_name: profileCopy.developer_name || null,
      developer_email: profileCopy.developer_email || null,
      bio: profileCopy.bio || null,
      profile_pic: profileCopy.profile_pic || null,
      developer_twitter: profileCopy.developer_twitter || null,
      developer_telegram: profileCopy.developer_telegram || null,
      developer_github: profileCopy.developer_github || null,
      developer_website: profileCopy.developer_website || null,
      // Cast the SocialLink[] to Json for Supabase
      additional_social_links: (profileCopy.additional_social_links || []) as unknown as Json
    };
    
    // Debug to see what we're sending to Supabase
    console.log("Upserting profile with data:", supabaseData);
    
    const { data, error } = await supabase
      .from('developer_profiles')
      .upsert(supabaseData)
      .select();
    
    if (error) {
      console.error("Error upserting developer profile:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("No data returned after upsert");
    }
    
    // Transform back to typed DeveloperProfile
    const transformedData = data[0];
    const socialLinks: SocialLink[] = Array.isArray(transformedData.additional_social_links) 
      ? transformedData.additional_social_links.map((link: any) => ({
          type: link.type || '',
          url: link.url || ''
        }))
      : [];
    
    return {
      wallet_address: transformedData.wallet_address,
      developer_name: transformedData.developer_name,
      developer_email: transformedData.developer_email,
      bio: transformedData.bio,
      profile_pic: transformedData.profile_pic,
      developer_twitter: transformedData.developer_twitter,
      developer_telegram: transformedData.developer_telegram,
      developer_github: transformedData.developer_github,
      developer_website: transformedData.developer_website,
      additional_social_links: socialLinks,
      created_at: transformedData.created_at,
      updated_at: transformedData.updated_at
    };
  } catch (error) {
    console.error("Error in upsertDeveloperProfile:", error);
    return null;
  }
};

/**
 * Uploads a profile picture for a developer
 * @param file The image file
 * @param walletAddress The developer's wallet address
 * @returns URL of the uploaded image or null if upload failed
 */
export const uploadProfilePicture = async (file: File, walletAddress: string): Promise<string | null> => {
  try {
    if (!file || !walletAddress) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${walletAddress}_${Date.now()}.${fileExt}`;
    const filePath = `developer_profiles/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('sciencegents')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error("Error uploading profile picture:", uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('sciencegents')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    return null;
  }
};
