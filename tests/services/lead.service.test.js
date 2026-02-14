import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LeadService } from '../../services/lead.service'
import { LeadRepository } from '../../lib/repositories/lead.repository'

// Mock the repository
vi.mock('../../lib/repositories/lead.repository', () => {
    const MockLeadRepository = vi.fn();
    MockLeadRepository.prototype.client = {
        from: vi.fn(), // Will be mocked dynamically
        select: vi.fn(),
        eq: vi.fn(),
        range: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        single: vi.fn()
    };
    MockLeadRepository.prototype.findLeadsWithRelations = vi.fn();
    MockLeadRepository.prototype.findWithRelations = vi.fn();
    MockLeadRepository.prototype.create = vi.fn();
    MockLeadRepository.prototype.update = vi.fn();
    MockLeadRepository.prototype.delete = vi.fn();

    return { LeadRepository: MockLeadRepository };
})

describe('LeadService', () => {
    let mockRepo;

    beforeEach(() => {
        vi.clearAllMocks()
        mockRepo = new LeadRepository()
    })

    describe('getLeads', () => {
        it('should fetch leads with pagination', async () => {
            const mockLeads = [{ id: 1, name: 'Test Lead' }]

            // Mock main query (findLeadsWithRelations)
            const mockQueryBuilder = {
                range: vi.fn().mockResolvedValue({ data: mockLeads, error: null })
            }
            mockRepo.findLeadsWithRelations.mockResolvedValue(mockQueryBuilder)

            // Mock count query chain: client.from('leads').select(..., { count: 'exact' }).eq(...)

            const mockEqBuilder = {
                // eq returns a Promise because we await it in the service
                then: (resolve) => resolve({ count: 20, error: null })
            }

            const mockSelectBuilder = {
                eq: vi.fn().mockReturnValue(mockEqBuilder)
            }

            const mockFromBuilder = {
                select: vi.fn().mockReturnValue(mockSelectBuilder)
            }

            mockRepo.client.from.mockReturnValue(mockFromBuilder)

            const result = await LeadService.getLeads('org-123', { page: 1, limit: 10 })

            expect(mockRepo.findLeadsWithRelations).toHaveBeenCalledWith('org-123', { page: 1, limit: 10 })
            expect(result.leads).toEqual(mockLeads)
            expect(result.metadata.total).toBe(20)
            expect(result.metadata.hasMore).toBe(true)
        })
    })

    describe('createLead', () => {
        it('should create a lead correctly', async () => {
            const newLead = { name: 'New Lead' }
            const createdLead = { id: 1, ...newLead }

            mockRepo.create.mockResolvedValue(createdLead)

            const result = await LeadService.createLead(newLead, 'org-123', 'user-1')

            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Lead',
                organization_id: 'org-123',
                created_by: 'user-1'
            }))
            expect(result).toEqual(createdLead)
        })
    })
})
