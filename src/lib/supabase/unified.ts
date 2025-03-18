import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types";

export enum ClientType {
    SERVER = 'server',
    SPA = 'spa'
}

export class SassClient {
    private client: SupabaseClient<Database>;
    private clientType: ClientType;

    constructor(client: SupabaseClient, clientType: ClientType) {
        this.client = client;
        this.clientType = clientType;

    }

    async loginEmail(email: string, password: string) {
        return this.client.auth.signInWithPassword({
            email: email,
            password: password
        });
    }

    async registerEmail(email: string, password: string) {
        return this.client.auth.signUp({
            email: email,
            password: password
        });
    }

    async exchangeCodeForSession(code: string) {
        return this.client.auth.exchangeCodeForSession(code);
    }

    async resendVerificationEmail(email: string) {
        return this.client.auth.resend({
            email: email,
            type: 'signup'
        })
    }

    async logout() {
        const { error } = await this.client.auth.signOut({
            scope: 'local'
        });
        if (error) throw error;
        if (this.clientType === ClientType.SPA) {
            window.location.href = '/auth/login';
        }
    }

    async uploadFile(myId: string, filename: string, file: File) {
        filename = filename.replace(/[^0-9a-zA-Z!\-_.*'()]/g, '_');
        filename = myId + "/" + filename
        return this.client.storage.from('files').upload(filename, file);
    }

    async getFiles(myId: string) {
        return this.client.storage.from('files').list(myId)
    }

    async deleteFile(myId: string, filename: string) {
        filename = myId + "/" + filename
        return this.client.storage.from('files').remove([filename])
    }

    async shareFile(myId: string, filename: string, timeInSec: number, forDownload: boolean = false) {
        filename = myId + "/" + filename
        return this.client.storage.from('files').createSignedUrl(filename, timeInSec, {
            download: forDownload
        });

    }

    async getMyTodoList(page: number = 1, pageSize: number = 100, order: string = 'created_at', done: boolean | null = false) {
        let query = this.client.from('todo_list').select('*').range(page * pageSize - pageSize, page * pageSize - 1).order(order)
        if (done !== null) {
            query = query.eq('done', done)
        }
        return query
    }

    async createTask(row: Database["public"]["Tables"]["todo_list"]["Insert"]) {
        return this.client.from('todo_list').insert(row)
    }

    async removeTask(id: string) {
        return this.client.from('todo_list').delete().eq('id', parseInt(id))
    }

    async updateAsDone(id: string) {
        return this.client.from('todo_list').update({ done: true }).eq('id', parseInt(id))
    }
    
    async toggleTaskCompletion(id: string, completed: boolean) {
        console.log(`=== SassClient.toggleTaskCompletion ===`);
        console.log(`Parameters - id: ${id}, completed: ${completed}`);
        
        try {
            // Verify the task exists before updating
            console.log(`Checking if task ${id} exists`);
            const { data: existingTask, error: fetchError } = await this.client
                .from('todo_list')
                .select('*')
                .eq('id', parseInt(id))
                .single();
                
            if (fetchError) {
                console.error(`Error fetching task ${id}:`, fetchError);
                throw fetchError;
            }
            
            if (!existingTask) {
                console.error(`Task ${id} not found`);
                throw new Error(`Task ${id} not found`);
            }
            
            console.log(`Found existing task:`, existingTask);
            console.log(`Current done status: ${existingTask.done}, updating to: ${completed}`);
            
            // Prepare update data
            const updateData = { 
                done: completed,
                done_at: completed ? new Date().toISOString() : null 
            };
            console.log(`Update data:`, updateData);
            
            // Perform the update
            console.log(`Updating task ${id} in todo_list table`);
            const { data, error } = await this.client
                .from('todo_list')
                .update(updateData)
                .eq('id', parseInt(id))
                .select();
                
            if (error) {
                console.error(`Error updating task ${id}:`, error);
                throw error;
            }
            
            console.log(`Task ${id} updated successfully:`, data);
            return { success: true, data };
        } catch (error) {
            console.error(`Exception in toggleTaskCompletion:`, error);
            throw error;
        }
    }

    getSupabaseClient() {
        return this.client;
    }


}
