const { createClient } = require('@supabase/supabase-js');
const { nanoid } = require('nanoid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadResume = async (fileBuffer, originalName, mimeType) => {
    try {
        const fileExt = originalName.split('.').pop();
        const fileName = `${nanoid()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return { publicUrl, fileName: filePath };
    } catch (error) {
        console.error('Supabase Upload Error:', error.message);
        throw error;
    }
};
const pingSupabase = async () => {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        console.log('[Supabase] Successfully pinged storage to prevent auto-pause.');
        return true;
    } catch (error) {
        console.error('[Supabase] Health ping failed:', error.message);
        return false;
    }
};

module.exports = { uploadResume, pingSupabase };
