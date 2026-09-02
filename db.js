import { supabase } from './supabaseClient.js';

export const fetchCables = async ({ page = 1, pageSize = 50 } = {}) => {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, error } = await supabase
    .from('cables')
    .select(`
      id,
      name,
      category,
      connector_type,
      description,
      purpose,
      features,
      image_url,
      created_at
    `)
    .order('name', { ascending: true })
    .range(from, to);

  return { data, error };
};

export const fetchCableCategories = async () => {
  const { data, error } = await supabase
    .from('cables')
    .select('category')
    .order('category', { ascending: true });

  if (error) {
    return { data: [], error };
  }

  const uniqueCategories = [
    ...new Set(
      (data || [])
        .map(item => item.category)
        .filter(Boolean)
    )
  ];

  return {
    data: uniqueCategories,
    error: null
  };
};

export const createCable = async (cable) => {
  const { data, error } = await supabase
    .from('cables')
    .insert({
      name: cable.name,
      category: cable.category,
      connector_type: cable.connector_type || null,
      description: cable.description,
      purpose: cable.purpose,
      features: cable.features || null,
      image_url: cable.image_url || null
    })
    .select()
    .single();

  return { data, error };
};

export const updateCable = async (id, cable) => {
  const { data, error } = await supabase
    .from('cables')
    .update({
      name: cable.name,
      category: cable.category,
      connector_type: cable.connector_type || null,
      description: cable.description,
      purpose: cable.purpose,
      features: cable.features || null,
      image_url: cable.image_url || null
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteCable = async (id) => {
  const { error } = await supabase
    .from('cables')
    .delete()
    .eq('id', id);

  return { error };
};