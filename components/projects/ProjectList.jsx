import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Megaphone, Building2, MapPin } from "lucide-react"

export default function ProjectList({ projects, onEdit, onDelete, onView, onStartCampaign, deletingId }) {
    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-slate-500">No projects to display.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Project Info</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        let meta = {}
                        try {
                            meta = typeof project.metadata === 'string'
                                ? JSON.parse(project.metadata)
                                : project.metadata || {}
                        } catch (e) {
                            // ignore
                        }
                        const re = meta.real_estate || {}
                        const prop = re.property || {}
                        const loc = re.location || {}

                        return (
                            <TableRow key={project.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                        {project.image_url ? (
                                            <img
                                                src={project.image_url}
                                                alt={project.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-slate-900">{project.name}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{project.address}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-slate-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {loc.city || 'N/A'}, {loc.locality || ''}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <span className="capitalize px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-medium">
                                            {prop.category || 'Project'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onStartCampaign(project)}
                                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="Start Campaign"
                                        >
                                            <Megaphone className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onView(project)}
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(project)}
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(project)}
                                            disabled={deletingId === project.id}
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
