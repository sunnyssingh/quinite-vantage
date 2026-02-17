import { ArrowRight } from 'lucide-react'

export default function PublicAboutSection({ content }) {
    return (
        <section className="w-full py-24 px-8 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-700">
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight relative inline-block">
                        {content.heading || 'About Us'}
                        <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full" />
                    </h2>
                    <p className="text-lg text-slate-600 leading-looose text-justify">
                        {content.text || 'We are a premier real estate developer focused on creating sustainable and luxurious living spaces. Our mission is to transform landscapes into thriving communities.'}
                    </p>
                    <button className="group flex items-center font-semibold text-primary hover:text-primary/80 transition-colors">
                        Learn More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                {content.image !== false && (
                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3 transition-transform group-hover:rotate-6" />
                        <div className="relative h-96 bg-slate-100 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Placeholder for real image */}
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                [About Image]
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
