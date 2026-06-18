import { getRoutines } from '@/actions/routines';
import RoutineColumnClient from './RoutineColumnClient';

export default async function RoutineColumn() {
    const { data: routines, isDbMissing } = await getRoutines();
    return <RoutineColumnClient initialRoutines={routines} isDbMissing={isDbMissing} />;
}
