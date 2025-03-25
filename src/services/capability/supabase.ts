import { getSupabaseClient } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadFileToStorage = async (file: File, bucketName: string, folderName: string) => {
  try {
    const supabase = getSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `${folderName}/${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to Supabase storage:', error);
      throw error;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
    return { data, url };
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    throw error;
  }
};

// Update the upsertCapabilityToSupabase function to include detailed_description field
export const upsertCapabilityToSupabase = async (capability: any, isNew = false) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('capabilities')
      .upsert({
        id: capability.id,
        name: capability.name,
        domain: capability.domain,
        description: capability.description,
        detailed_description: capability.detailed_description, // New field
        price: capability.price,
        creator: capability.creator,
        display_image: capability.display_image,
        developer_profile_pic: capability.developer_profile_pic,
        social_links: capability.social_links,
        additional_files: capability.files?.additionalFiles || [],
        docs: capability.files?.documentation || capability.files?.integrationGuide, // Backward compatibility
        features: capability.features || [],
        // Stats fields have defaults in the database
        created_at: isNew ? new Date().toISOString() : undefined,
        last_synced_at: new Date().toISOString()
      }, { returning: 'minimal' });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error upserting capability to Supabase:', error);
    throw error;
  }
};
