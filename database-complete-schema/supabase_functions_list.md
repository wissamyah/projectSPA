PS C:\Users\wissa\Documents\spaBookingApp> npx supabase functions list


   ID                                   | NAME       | SLUG       | STATUS | VERSION | UPDATED_AT (UTC)
  --------------------------------------|------------|------------|--------|---------|---------------------
   f385c85f-006b-4243-8869-8b73e7868e3b | send-email | send-email | ACTIVE | 8       | 2025-09-13 14:32:12

   PS C:\Users\wissa\Documents\spaBookingApp> npx supabase functions describe send-email
Manage Supabase Edge functions

Usage:
  supabase functions [command]

Available Commands:
  delete      Delete a Function from Supabase    
  deploy      Deploy a Function to Supabase      
  download    Download a Function from Supabase  
  list        List all Functions in Supabase     
  new         Create a new Function locally      
  serve       Serve all Functions locally        

Flags:
  -h, --help   help for functions

Global Flags:
      --create-ticket                            
      create a support ticket for any CLI error  
      --debug                                    
      output debug logs to stderr
      --dns-resolver [ native | https ]          
      lookup domain names using the specified resolver (default native)
      --experimental                             
      enable experimental features
      --network-id string                        
      use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                           
      use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                           
      path to a Supabase project directory       
      --yes                                      
      answer yes to all prompts

