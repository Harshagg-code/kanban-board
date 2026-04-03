import { supabase } from '../supabaseClient'

export const logActivity = async (taskId, userId, description) => {
    const { error } = await supabase
        .from('activity')
        .insert({
            task_id: taskId,
            user_id: userId,
            description,
        })

    if (error) console.error('Activity log error:', error)
}