export function log(event, meta){
  try{ console.log(`[db] ${event}`, meta||{}) }catch(e){}
}
export function warn(event, meta){
  try{ console.warn(`[db] ${event}`, meta||{}) }catch(e){}
}
export function error(event, meta){
  try{ console.error(`[db] ${event}`, meta||{}) }catch(e){}
}